const fetch = require('node-fetch');

const GEMINI_URL = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

async function geminiChat(systemPrompt, messages, config = {}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set in .env');
  }

  const recentMessages = messages.slice(-6);

  const contents = recentMessages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const payload = {
    ...(systemPrompt
      ? { system_instruction: { parts: [{ text: systemPrompt }] } }
      : {}),
    contents,
    generationConfig: {
      temperature:     config.temperature     ?? 0.7,
      maxOutputTokens: config.maxOutputTokens ?? 300,
    },
  };

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 100000);

  try {
    const res = await fetch(GEMINI_URL(), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Gemini timeout — took longer than 10 seconds');
    }
    throw err;
  }
}

function parseGeminiJSON(raw) {
  const cleaned = (raw || '').replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { geminiChat, parseGeminiJSON };