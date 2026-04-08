const CrisisAlert = require('../models/CrisisAlert');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');

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

  if (lower.includes('exam') || lower.includes('stress') || lower.includes('overwhelmed')) {
    return "Thanks for sharing that — exam stress can feel very heavy, and you're not weak for feeling this way.\n\nTry this quick reset:\n1) Inhale for 4 seconds\n2) Hold for 4 seconds\n3) Exhale for 6 seconds\nRepeat 4 times.\n\nThen pick just one next step for the next 20 minutes. If you want, I can help you break your study load into a simple plan.";
  }

  if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('panic')) {
    return "I hear you. Anxiety can make everything feel urgent and unsafe, even when you're doing your best.\n\nLet’s ground your body first: name 5 things you can see, 4 things you can feel, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.\n\nIf you'd like, we can also book a counsellor session from the app together.";
  }

  if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('tired')) {
    return "Sleep struggles can affect your whole mood and focus. A small routine tonight can help:\n- No screen 30 minutes before bed\n- Slow breathing for 2 minutes\n- Keep room cool and lights dim\n- Write down worries in one short note, then close it\n\nWould you like a simple 3-night sleep reset plan?";
  }

  return "Thank you for opening up. I’m here with you.\n\nEven when things feel heavy, talking about it is a strong first step. Would you like to share what feels hardest right now — thoughts, body symptoms, or a specific situation? We can work through it one step at a time.";
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

// @desc    Respond to user chat message using Claude AI
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
      await ChatMessage.create({ user: req.user.id, role: 'user', text: message, isCrisis });
    } catch (saveErr) {
      console.error('Failed to save user message:', saveErr.message);
    }

    if (isCrisis) {
      try {
        await CrisisAlert.create({ user: req.user.id, message: message.slice(0, 500) });
      } catch (saveErr) {
        console.error('Failed to save crisis alert:', saveErr.message);
      }
      try {
        const user = await User.findById(req.user.id);
        if (user) await notifyGuardian(user, message);
      } catch (notifyErr) {
        console.error('Failed to notify guardian:', notifyErr.message);
      }

      const crisisReply = "I'm really concerned about you right now, and I want you to know you are not alone.\n\nI've immediately alerted your emergency contact and a counsellor will reach out to you very soon.\n\nPlease reach out right now:\n• iCall (India): 9152987821\n• Vandrevala Foundation: 1860-2662-345 (24/7)\n• Emergency Services: 112\n\nYou matter deeply, and there are people who care about you. Can you tell me — are you safe right now?";

      // Save crisis assistant reply to DB
      try {
        await ChatMessage.create({ user: req.user.id, role: 'assistant', text: crisisReply, isCrisis: true });
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

    // 2. Load last 20 messages from DB for this user (reliable persistent history)
    let dbHistory = [];
    try {
      const pastMessages = await ChatMessage.find({ user: req.user.id })
        .sort({ createdAt: 1 })
        .limit(40)
        .lean();
      // Exclude the message we just saved (last entry) to avoid duplication
      dbHistory = pastMessages.slice(0, -1).map(m => ({ role: m.role, content: m.text }));
    } catch (histErr) {
      console.error('Failed to load chat history:', histErr.message);
      // Fall back to frontend-provided history if DB read fails
      dbHistory = history.map(t => ({ role: t.role, content: t.text }));
    }

    // Add the current user message at the end
    const claudeMessages = [...dbHistory, { role: 'user', content: message }];

    // 3. Call Claude API (with local fallback if unavailable)
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    let aiText = '';
    let provider = 'fallback';
    const systemPrompt = `You are MindEase, a warm and empathetic AI mental health support companion for college students.

Your role:
- Listen deeply and respond with genuine empathy and care
- Ask thoughtful follow-up questions to understand the user better
- Provide evidence-based coping strategies (CBT, mindfulness, grounding) when appropriate
- Gently encourage professional help when needed
- Remember context from earlier in the conversation and refer back to it naturally
- Never give identical cookie-cutter responses — each reply should feel personal and specific to what this person shared

Tone: warm, non-judgmental, conversational, like talking to a caring friend who also knows about mental health.

SAFETY RULES:
- If the user mentions suicide, self-harm, or hurting themselves, treat it as an emergency: validate their pain deeply, provide crisis hotlines (iCall: 9152987821, Vandrevala: 1860-2662-345, Emergency: 112).
- Never diagnose.
- Never replace professional therapy.

Platform context: MindEase is a digital psychological support platform. Users can also book appointments with real counsellors, track moods, and journal.`;

    if (ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      try {
        const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            system: systemPrompt,
            messages: claudeMessages
          })
        });

        if (!apiResponse.ok) {
          const errText = await apiResponse.text();
          throw new Error(`Claude API error: ${errText}`);
        }

        const aiData = await apiResponse.json();
        aiText = aiData.content?.[0]?.text || '';
        provider = 'anthropic';
      } catch (apiErr) {
        console.error('Claude API unavailable, switching to fallback response:', apiErr.message);
      }
    }

    if (!aiText) {
      aiText = generateFallbackReply(message);
      provider = 'fallback';
    }

    // Save assistant reply to DB
    try {
      await ChatMessage.create({ user: req.user.id, role: 'assistant', text: aiText, isCrisis: false });
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
    const messages = await ChatMessage.find({ user: req.user.id })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
