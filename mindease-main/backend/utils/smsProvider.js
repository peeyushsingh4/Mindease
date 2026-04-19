const TEXTBELT_API_URL = process.env.TEXTBELT_API_URL || 'https://textbelt.com/text';

async function sendSms({ to, message }) {
  const apiKey = process.env.TEXTBELT_API_KEY;
  if (!apiKey || !to || !message) {
    return { sent: false, reason: 'missing_config_or_payload' };
  }

  try {
    const response = await fetch(TEXTBELT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        phone: to,
        message,
        key: apiKey,
      }).toString(),
    });
    const payload = await response.json();
    return {
      sent: Boolean(payload?.success),
      textId: payload?.textId || '',
      reason: payload?.error || '',
      quotaRemaining: Number.isFinite(Number(payload?.quotaRemaining)) ? Number(payload.quotaRemaining) : null,
    };
  } catch (err) {
    return { sent: false, reason: err.message || 'request_failed' };
  }
}

module.exports = {
  sendSms,
};
