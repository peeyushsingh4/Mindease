const { getDb } = require('../lib/firebase');

const nowIso = () => new Date().toISOString();
const chatCollection = () => getDb().collection('chatMessages');
const usersCollection = () => getDb().collection('users');
const crisisCollection = () => getDb().collection('crisisAlerts');

// ─── Crisis keyword detection (fast pre-screen before LLM) ──────────────────
const crisisKeywords = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'harm myself', 'cut myself', 'no reason to live', 'giving up on life',
  'overdose', "don't want to be here", 'take my life', 'end it all',
  'planning to die', 'better off dead'
];

function detectCrisis(text) {
  const lower = text.toLowerCase();
  return crisisKeywords.some(kw => lower.includes(kw));
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
  const guardianPhone = user.guardianPhone;
  const guardianName  = user.guardianName  || 'Guardian';
  const userName      = user.isAnonymous ? `Anonymous user (${user.anonymousId})` : (user.name || 'A user');

  const smsBody = `URGENT - MindCare Crisis Alert\n\nHi ${guardianName},\n${userName} on MindCare may be in crisis and needs immediate support.\n\nPlease check in with them right away or call emergency services (112 / 988).\n\n- MindCare Safety Team`;

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER && guardianPhone) {
    try {
      const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await twilio.messages.create({ body: smsBody, from: TWILIO_FROM_NUMBER, to: guardianPhone });
      console.log(`[CRISIS] SMS sent to guardian ${guardianPhone} for user ${user._id}`);
    } catch (err) {
      console.error('[CRISIS] Twilio SMS failed:', err.message);
    }
  } else {
    console.warn('=========================================================');
    console.warn('[CRISIS ALERT] TWILIO NOT CONFIGURED - would send SMS:');
    console.warn(`User    : ${userName} (${user._id})`);
    console.warn(`Guardian: ${guardianName} - ${guardianPhone || 'NO PHONE ON FILE'}`);
    console.warn(`Message : ${triggerMessage.slice(0, 200)}`);
    console.warn('=========================================================');
  }
}

// @desc    Respond to user chat message using OpenAI
// @route   POST /api/chat/respond
// @access  Private
exports.chatRespond = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }

    // 1. Fast crisis pre-screen
    const isCrisis = detectCrisis(message);

    // Save the incoming user message to DB (always, before responding)
    try {
      await chatCollection().add({ user: req.user.id, role: 'user', text: message, isCrisis, createdAt: nowIso() });
    } catch (saveErr) {
      console.error('Failed to save user message:', saveErr.message);
    }

    if (isCrisis) {
      try {
        await crisisCollection().add({ user: req.user.id, message: message.slice(0, 500), createdAt: nowIso() });
      } catch (saveErr) {
        console.error('Failed to save crisis alert:', saveErr.message);
      }
      try {
        const userDoc = await usersCollection().doc(req.user.id).get();
        if (userDoc.exists) await notifyGuardian({ _id: userDoc.id, ...userDoc.data() }, message);
      } catch (notifyErr) {
        console.error('Failed to notify guardian:', notifyErr.message);
      }

      const crisisReply = "I'm really concerned about you right now, and I want you to know you are not alone.\n\nI've immediately alerted your emergency contact and a counsellor will reach out to you very soon.\n\nPlease reach out right now:\n• iCall (India): 9152987821\n• Vandrevala Foundation: 1860-2662-345 (24/7)\n• Emergency Services: 112\n\nYou matter deeply, and there are people who care about you. Can you tell me — are you safe right now?";

      // Save crisis assistant reply to DB
      try {
        await chatCollection().add({ user: req.user.id, role: 'assistant', text: crisisReply, isCrisis: true, createdAt: nowIso() });
      } catch (saveErr) {
        console.error('Failed to save crisis reply:', saveErr.message);
      }

      return res.status(200).json({
        success: true,
        data: {
          isCrisis: true,
          consultantPing: true,
          response: crisisReply,
          action: 'trigger_alert_ui'
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
        .slice(0, 40);
      // Sort back to chronological order for the model and exclude the freshly-saved input.
      const chronological = pastMessages.reverse();
      dbHistory = chronological.slice(0, -1).map(m => ({ role: m.role, content: m.text }));
    } catch (histErr) {
      console.error('Failed to load chat history:', histErr.message);
      // Fall back to frontend-provided history if DB read fails
      dbHistory = history.map(t => ({ role: t.role, content: t.text }));
    }

    // Add the current user message at the end
    const conversationMessages = [...dbHistory, { role: 'user', content: message }];

    // 3. Call OpenAI API (with local fallback if unavailable)
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    let aiText = '';
    let provider = 'fallback';
    const systemPrompt = `You are MindEase, a highly supportive mental-health counselling companion for college students.

Response style requirements:
- Start by validating the user's feelings in plain, human language.
- Reflect one concrete detail from the user's message so it feels personalized.
- Keep responses concise (around 90-220 words unless user asks for detail).
- Offer one actionable coping step (breathing, grounding, reframing, routine, or help-seeking).
- Use counselling micro-skills: reflection, normalization, and collaborative next-step planning.
- When useful, briefly apply CBT-style framing (thought-feeling-behavior) in simple words.
- Ask one gentle follow-up question to continue the conversation.
- Never be preachy or robotic; avoid repeating identical templates.

Clinical and safety boundaries:
- You are not a replacement for licensed therapy, diagnosis, or emergency care.
- Do not provide diagnoses or medication advice.
- If risk appears high, encourage immediate professional or emergency support.
- If the user asks for psychiatrist-level clinical interpretation, provide psychoeducation and suggest qualified professional assessment.

SAFETY RULES:
- If the user mentions suicide, self-harm, or hurting themselves, treat it as an emergency: validate their pain deeply, provide crisis hotlines (iCall: 9152987821, Vandrevala: 1860-2662-345, Emergency: 112).
- Never diagnose.
- Never replace professional therapy.

Platform context: MindEase is a digital psychological support platform. Users can book appointments with counsellors, track moods, and journal.

Output format:
- Plain text only (no markdown headings).
- Prefer short paragraphs and short bullet-like lines only when listing steps.`;

    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.7,
            max_tokens: 500,
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationMessages
            ]
          })
        });

        if (!apiResponse.ok) {
          const errText = await apiResponse.text();
          throw new Error(`OpenAI API error: ${errText}`);
        }

        const aiData = await apiResponse.json();
        aiText = aiData?.choices?.[0]?.message?.content || '';
        provider = 'openai';
      } catch (apiErr) {
        console.error('OpenAI API unavailable, switching to fallback response:', apiErr.message);
      }
    }

    if (!aiText) {
      aiText = generateFallbackReply(message);
      provider = 'fallback';
    }

    // Save assistant reply to DB
    try {
        await chatCollection().add({ user: req.user.id, role: 'assistant', text: aiText, isCrisis: false, createdAt: nowIso() });
    } catch (saveErr) {
      console.error('Failed to save assistant reply:', saveErr.message);
    }

    res.status(200).json({
      success: true,
      data: {
        isCrisis: false,
        consultantPing: false,
        response: aiText,
        provider
      }
    });

  } catch (err) {
    console.error('chatRespond error:', err);
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
