const { sanitizeUserText } = require('./crisisDetection');

function normalize(text) {
  return sanitizeUserText(text || '').toLowerCase();
}

function looksLikeAmbiguousSelfHarm(text) {
  const t = normalize(text);
  if (!t) return false;
  // Ambiguous “giving up” language that should be treated cautiously.
  return (
    /\bcan'?t do this anymore\b/.test(t) ||
    /\bi don'?t want to be here\b/.test(t) ||
    /\bi want to disappear\b/.test(t) ||
    /\bi want it to stop\b/.test(t) ||
    /\beveryone would be better off\b/.test(t) ||
    /\bwhat'?s the point\b/.test(t) ||
    /\bi feel like giving up\b/.test(t)
  );
}

function looksLikeRequestForSelfHarmInstructions(text) {
  const t = normalize(text);
  if (!t) return false;
  // Disallowed: instructions / methods / optimization to harm self.
  return (
    /\bhow (do i|to)\b.*\b(kill myself|end my life|suicide)\b/.test(t) ||
    /\b(best|painless|quickest)\b.*\bway\b.*\b(die|suicide|kill myself)\b/.test(t) ||
    /\bmethods?\b.*\b(suicide|kill myself)\b/.test(t) ||
    /\bhow much\b.*\b(overdose|pills?)\b/.test(t) ||
    /\bwhat (pills?|drug)\b.*\bto\b.*\b(overdose|die)\b/.test(t)
  );
}

function looksLikeRequestForViolenceInstructions(text) {
  const t = normalize(text);
  if (!t) return false;
  return (
    /\bhow (do i|to)\b.*\b(hurt|kill|attack)\b.*\b(someone|people|them|him|her)\b/.test(t) ||
    /\bmake\b.*\b(bomb|poison)\b/.test(t)
  );
}

function buildRefusalReply() {
  return [
    "I can’t help with instructions to harm yourself or anyone else.",
    "If you’re feeling unsafe or thinking about hurting yourself, you deserve immediate support right now.",
    "If you're in immediate danger, call your local emergency number (112 in India).",
    "If you can, reach out to a trusted person nearby and stay with them.",
    "Would you tell me what country you’re in so I can share the most relevant crisis helplines?"
  ].join('\n');
}

function evaluateSafety(text) {
  const t = sanitizeUserText(text || '');

  if (looksLikeRequestForSelfHarmInstructions(t) || looksLikeRequestForViolenceInstructions(t)) {
    return { action: 'refuse', reply: buildRefusalReply(), reason: 'disallowed_instructions' };
  }

  if (looksLikeAmbiguousSelfHarm(t)) {
    return { action: 'ambiguous_crisis', reason: 'ambiguous_self_harm_language' };
  }

  return { action: 'allow', reason: 'ok' };
}

module.exports = {
  evaluateSafety
};

