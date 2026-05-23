// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// routes/chat.js — POST /api/chat
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const express              = require('express');
const router               = express.Router();
const { geminiChat }       = require('../helpers/gemini');
const { getFallbackReply } = require('../helpers/fallbacks');

router.post('/', async (req, res) => {
  const { messages, transaction } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const systemPrompt = `You are DisputeAI, an AI fraud dispute assistant built into Be U by Bank Islam.

You help Malaysian users who have experienced financial fraud or made accidental transfers.
You are empathetic, clear, and professional.

You already know these transaction details — do not ask for them again:
- Reference:  ${transaction?.ref      || 'Unknown'}
- Amount:     RM ${transaction?.amount ? Math.abs(transaction.amount).toFixed(2) : 'Unknown'}
- Merchant:   ${transaction?.merchant  || 'Unknown'}
- Time:       ${transaction?.time      || 'Unknown'}
- Platform:   Be U by Bank Islam

Gather these 4 facts through natural conversation:
1. How the scammer first contacted the user (WhatsApp, call, SMS, email)
2. What method was used (QR code, link, OTP, impersonation)
3. Scammer's contact number or display name
4. Whether the user has screenshots as evidence

Rules:
- SHORT replies — max 2-3 sentences
- Friendly English, occasional Malay greetings (Assalamu'alaikum)
- NO markdown formatting (no bold, no bullets)
- Do NOT repeat what the user already said
- Once you have all 4 facts, say you are ready to generate their report`;

  try {
    const reply = await geminiChat(systemPrompt, messages, {
      temperature: 0.7, maxOutputTokens: 300,
    });

    if (!reply) {
      return res.json({ reply: getFallbackReply(messages.length), fallback: true });
    }
    res.json({ reply });

  } catch (err) {
    console.error('[chat] Gemini error:', err.message);
    res.json({ reply: getFallbackReply(messages.length), fallback: true });
  }
});

module.exports = router;
