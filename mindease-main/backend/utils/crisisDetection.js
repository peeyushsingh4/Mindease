const CRISIS_PATTERNS = [
  /suicid(e|al)/i,
  /kill myself/i,
  /end my life/i,
  /want to die/i,
  /no reason to live/i,
  /better off dead/i,
  /harm myself/i,
  /cut myself/i,
  /overdose/i,
  /self[- ]harm/i,
  /hurt (myself|others)/i,
  /attack (someone|people)/i,
  /violent|violence/i,
  /abuse(d|ive)?/i,
  /panic attack/i,
  /mental breakdown/i,
  /i am not safe/i
];

function sanitizeUserText(input) {
  if (typeof input !== 'string') return '';
  // Remove control characters and cap size to reduce abuse/prompt stuffing.
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

function redactSensitiveText(input) {
  const text = sanitizeUserText(input || '');
  if (!text) return '';

  // Email addresses
  let out = text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted_email]');

  // Phone-like sequences (kept intentionally conservative)
  out = out.replace(/(\+?\d[\d\s().-]{7,}\d)/g, '[redacted_phone]');

  // URLs
  out = out.replace(/\bhttps?:\/\/\S+\b/gi, '[redacted_url]');

  return out;
}

function isCrisisMessage(userText) {
  const text = sanitizeUserText(userText);
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

function buildCrisisReply(userText) {
  const snippet = sanitizeUserText(userText).slice(0, 120);
  const reflected = snippet ? `I hear that things feel very intense right now (${snippet}...).` : 'I hear that things feel very intense right now.';
  return [
    reflected,
    'I am really glad you reached out, and your safety matters right now.',
    'If you are in immediate danger, please call emergency services now (112 in India / local emergency number).',
    'Can you contact a trusted friend, family member, or nearby adult and stay with them?',
    'Please share your country/location so I can give the most relevant crisis helpline options.'
  ].join('\n');
}

module.exports = {
  isCrisisMessage,
  sanitizeUserText,
  redactSensitiveText,
  buildCrisisReply
};

