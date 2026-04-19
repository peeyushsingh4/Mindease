const { getDb } = require('../lib/firebase');
const { isCrisisMessage, sanitizeUserText, buildCrisisReply, redactSensitiveText } = require('../utils/crisisDetection');
const { getSupportiveReply } = require('../services/openaiService');
const { getUserMemory, updateUserMemory, memoryToPromptContext } = require('../memory/userMemory');
const { sendSms } = require('../utils/smsProvider');
const { scoreTextRisk } = require('../utils/riskScoring');
const { evaluateSafety } = require('../utils/safetyGate');
const { retrieveResources, resourcesToPromptContext } = require('../resources/retriever');

const nowIso = () => new Date().toISOString();
const chatCollection = () => getDb().collection('chatMessages');
const usersCollection = () => getDb().collection('users');
const crisisCollection = () => getDb().collection('crisisAlerts');

function truncateForModel(messages, keepLast = 8) {
  const arr = Array.isArray(messages) ? messages.filter(Boolean) : [];
  if (arr.length <= keepLast) return arr;
  return arr.slice(-keepLast);
}

function buildConversationSummary(history) {
  const items = Array.isArray(history) ? history : [];
  const userLines = items.filter((m) => m.role === 'user').slice(-4).map((m) => m.content).filter(Boolean);
  const assistantLines = items.filter((m) => m.role === 'assistant').slice(-2).map((m) => m.content).filter(Boolean);

  const bullets = [];
  if (userLines.length) bullets.push(`User_topics: ${userLines.map((t) => t.slice(0, 80)).join(' | ')}`);
  if (assistantLines.length) bullets.push(`Assistant_recent: ${assistantLines.map((t) => t.slice(0, 80)).join(' | ')}`);
  return bullets.join('\n').slice(0, 600);
}

function generateFallbackReply(message) {
  const lower = message.toLowerCase();
  const shortReflection = `Thank you for sharing this with me. It sounds like "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}" is weighing on you right now.`;

  if (lower.includes('exam') || lower.includes('stress') || lower.includes('overwhelmed')) {
    return `${shortReflection}\n\nIt makes sense that exam pressure is draining your mind and body. Let's make it manageable, one small step at a time.\n\nTry this now:\n1) Inhale for 4 seconds\n2) Hold for 4 seconds\n3) Exhale for 6 seconds\nRepeat 4 times.\n\nThen choose only one task for the next 20 minutes (not the whole syllabus). After that, we can plan your next block together.\n\nWould you like me to help you create a very simple 2-hour study plan right now?`;
  }

  if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('panic')) {
    return `${shortReflection}\n\nYou're not overreacting. Anxiety can make everything feel urgent even when you are trying your best.\n\nLet's ground your body first:\n- 5 things you can see\n- 4 things you can feel\n- 3 things you can hear\n- 2 things you can smell\n- 1 thing you can taste\n\nStay with each step slowly. Your body often settles before your thoughts do.\n\nDo you want to continue with a 60-second breathing exercise together?`;
  }

  if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('tired')) {
    return `${shortReflection}\n\nSleep problems can make everything else feel harder, so this is important.\n\nFor tonight, try a short wind-down routine:\n- No screens 30 minutes before bed\n- Slow breathing for 2 minutes\n- Dim lights and keep room cool\n- Write worries on paper, then set it aside\n\nWe don't need perfection tonight, only a calmer start.\n\nWould you like a practical 3-night sleep reset plan?`;
  }

  return `${shortReflection}\n\nI am here with you. Opening up like this takes courage.\n\nLet's slow things down and focus on one part first. If it helps, place one hand on your chest and take 5 slower breaths while reading this.\n\nWhat feels hardest right now: your thoughts, your emotions, or something happening in your life?`;
}

// ─── Send alert to guardian ───────────────────────────────────────────────────
async function notifyGuardian(user, triggerMessage) {
  const guardianPhone = user.guardianPhoneE164 || (user.guardianPhone ? `+91${String(user.guardianPhone).replace(/\D/g, '').slice(-10)}` : '');
  const guardianName  = user.guardianName  || 'Guardian';
  const userName      = user.isAnonymous ? `Anonymous user (${user.anonymousId})` : (user.name || 'A user');

  const smsBody = `URGENT - MindCare Crisis Alert\n\nHi ${guardianName},\n${userName} on MindCare may be in crisis and needs immediate support.\n\nPlease check in with them right away or call emergency services (112 / 988).\n\n- MindCare Safety Team`;

  if (guardianPhone) {
    const result = await sendSms({ to: guardianPhone, message: smsBody });
    if (result.sent) {
      console.log(`[CRISIS] SMS sent to guardian ${guardianPhone} for user ${user._id}`);
    } else {
      console.error('[CRISIS] SMS failed:', result.reason || 'unknown_error');
    }
  } else {
    console.warn('=========================================================');
    console.warn('[CRISIS ALERT] GUARDIAN PHONE NOT AVAILABLE - would send SMS:');
    console.warn(`User    : ${userName} (${user._id})`);
    console.warn(`Guardian: ${guardianName} - ${guardianPhone || 'NO PHONE ON FILE'}`);
    console.warn('Message : [redacted]');
    console.warn('=========================================================');
  }
}

// @desc    Respond to user chat message using OpenAI
// @route   POST /api/chat/respond
// @access  Private
exports.chatRespond = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const safeMessage = sanitizeUserText(message);
    if (!safeMessage) {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }

    // 1) Fast safety gate + crisis pre-screen + dataset-driven risk score
    const gate = evaluateSafety(safeMessage);
    const ruleCrisis = isCrisisMessage(safeMessage);
    const textRisk = scoreTextRisk(safeMessage);
    const isCrisis = ruleCrisis || textRisk.level === 'high' || gate.action === 'ambiguous_crisis';
    console.log(`[chatRespond] crisis_detected=${isCrisis} user=${req.user.id} risk=${textRisk.level}`);

    // Save the incoming user message to DB (always, before responding)
    const storedUserText = isCrisis ? redactSensitiveText(safeMessage) : safeMessage;
    try {
      await chatCollection().add({
        user: req.user.id,
        role: 'user',
        text: storedUserText,
        isCrisis,
        riskScore: textRisk.score,
        riskLevel: textRisk.level,
        riskModelVersion: textRisk.modelVersion,
        createdAt: nowIso()
      });
    } catch (saveErr) {
      console.error('Failed to save user message:', saveErr.message);
    }

    if (gate.action === 'refuse') {
      const refusal = gate.reply || generateFallbackReply(safeMessage);
      try {
        await chatCollection().add({ user: req.user.id, role: 'assistant', text: redactSensitiveText(refusal), isCrisis: false, createdAt: nowIso() });
      } catch (saveErr) {
        console.error('Failed to save refusal reply:', saveErr.message);
      }

      return res.status(200).json({
        success: true,
        data: {
          isCrisis: false,
          consultantPing: false,
          response: refusal,
          provider: 'safety-gate',
          risk: textRisk
        }
      });
    }

    if (isCrisis) {
      try {
        await crisisCollection().add({ user: req.user.id, message: redactSensitiveText(safeMessage).slice(0, 500), createdAt: nowIso() });
      } catch (saveErr) {
        console.error('Failed to save crisis alert:', saveErr.message);
      }
      try {
        const userDoc = await usersCollection().doc(req.user.id).get();
        if (userDoc.exists) await notifyGuardian({ _id: userDoc.id, ...userDoc.data() }, safeMessage);
      } catch (notifyErr) {
        console.error('Failed to notify guardian:', notifyErr.message);
      }

      const crisisReply = buildCrisisReply(safeMessage);

      // Save crisis assistant reply to DB
      try {
        await chatCollection().add({ user: req.user.id, role: 'assistant', text: redactSensitiveText(crisisReply), isCrisis: true, createdAt: nowIso() });
      } catch (saveErr) {
        console.error('Failed to save crisis reply:', saveErr.message);
      }

      return res.status(200).json({
        success: true,
        data: {
          isCrisis: true,
          consultantPing: true,
          response: crisisReply,
          action: 'trigger_alert_ui',
          risk: textRisk
        }
      });
    }

    // 2. Load recent messages from DB for this user (reliable persistent history)
    let dbHistory = [];
    try {
      const snapshot = await chatCollection().where('user', '==', req.user.id).get();
      const pastMessages = snapshot.docs
        .map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 30);
      // Sort back to chronological order for the model and exclude the freshly-saved input.
      const chronological = pastMessages.reverse();
      dbHistory = chronological.slice(0, -1).map(m => ({ role: m.role, content: m.text }));
    } catch (histErr) {
      console.error('Failed to load chat history:', histErr.message);
      // Fall back to frontend-provided history if DB read fails
      dbHistory = history.map(t => ({ role: t.role, content: t.text }));
    }

    // 3) Safe memory load and update
    let memory = await getUserMemory(req.user.id);
    memory = await updateUserMemory(req.user.id, {
      userName: req.user.name || req.user.anonymousId || '',
      userText: safeMessage
    });

    const safeHistoryForModel = truncateForModel(dbHistory, Number(process.env.CHAT_CONTEXT_TURNS || 8));
    const summary = buildConversationSummary(dbHistory);
    const groundedResources = retrieveResources({ text: safeMessage, riskLevel: textRisk.level, limit: 3 });
    const groundedContext = resourcesToPromptContext(groundedResources);

    // Add minimal context + compact memory context.
    const conversationMessages = [
      { role: 'system', content: `Risk signal: ${textRisk.level}.` },
      ...(groundedContext ? [{ role: 'system', content: groundedContext }] : []),
      ...(summary ? [{ role: 'system', content: `Conversation summary (non-sensitive):\n${summary}` }] : []),
      { role: 'system', content: `User memory context (safe summary): ${memoryToPromptContext(memory)}` },
      ...safeHistoryForModel,
      { role: 'user', content: safeMessage }
    ];

    // 4) Call OpenAI API (with safe fallback if unavailable)
    const { text: aiTextRaw, provider } = await getSupportiveReply({
      messages: conversationMessages,
      temperature: 0.6,
      maxTokens: 260
    });
    const aiText = aiTextRaw || generateFallbackReply(safeMessage);
    console.log(`[chatRespond] provider=${provider} user=${req.user.id}`);

    // Save assistant reply to DB
    try {
        await chatCollection().add({ user: req.user.id, role: 'assistant', text: redactSensitiveText(aiText), isCrisis: false, createdAt: nowIso() });
    } catch (saveErr) {
      console.error('Failed to save assistant reply:', saveErr.message);
    }

    res.status(200).json({
      success: true,
      data: {
        isCrisis: false,
        consultantPing: false,
        response: aiText,
        provider,
        risk: textRisk
      }
    });

  } catch (err) {
    console.error('chatRespond error:', err.message);
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
};

// @desc    Get chat history for current user
// @route   GET /api/chat/history
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    const snapshot = await chatCollection().where('user', '==', req.user.id).get();
    const messages = snapshot.docs
      .map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
      .slice(0, 100);
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
