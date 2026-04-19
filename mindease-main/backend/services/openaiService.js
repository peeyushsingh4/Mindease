const { COUNSELLOR_SYSTEM_PROMPT } = require('../prompts/counsellorSystemPrompt');

function formatFallbackResponse(userText) {
  const preview = userText.slice(0, 90);
  return [
    `It sounds like you're carrying a lot right now${preview ? ` around "${preview}${userText.length > 90 ? '...' : ''}"` : ''}.`,
    'Would you like to share what feels hardest at this moment?',
    'If it helps, try one minute of slow breathing: inhale 4, exhale 6, repeated gently.'
  ].join('\n');
}

async function getSupportiveReply({ messages, model, temperature = 0.6, maxTokens = 260 }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    const latestUser = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
    return { text: formatFallbackResponse(latestUser), provider: 'fallback-no-key' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: Math.min(0.7, Math.max(0.5, Number(temperature) || 0.6)),
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: COUNSELLOR_SYSTEM_PROMPT }, ...messages]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${errText}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('OpenAI returned empty response text');
    }
    return { text, provider: 'openai' };
  } catch (error) {
    console.error('[openaiService] fallback due to error:', error.message);
    const latestUser = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
    return { text: formatFallbackResponse(latestUser), provider: 'fallback-error' };
  }
}

module.exports = {
  getSupportiveReply
};

