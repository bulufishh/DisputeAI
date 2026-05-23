// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// routes/report.js — POST /api/report
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Generates a structured dispute report from the chat
// conversation using Gemini, then saves it to Supabase.
//
// Body:    { messages, transaction }
// Returns: full report object with submissionRoutes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const express                    = require('express');
const router                     = express.Router();
const { geminiChat, parseGeminiJSON } = require('../helpers/gemini');
const { buildFallbackReport }    = require('../helpers/fallbacks');
const { getSubmissionRoutes }    = require('../helpers/routingRules');
const { saveCase }               = require('../helpers/supabase');

router.post('/', async (req, res) => {
  const { messages, transaction } = req.body;

  // ── Ask Gemini to extract the report ─────────────────
  // Low temperature (0.1) = precise JSON extraction
  const reportPrompt = `Based on this fraud dispute conversation, extract and return ONLY a valid JSON object.
No markdown, no code fences, no explanation — just raw JSON.

{
  "caseId": "DAI-BISLM-${Date.now()}",
  "victim": "full name if mentioned, else 'Amirah binti Razak'",
  "platform": "Be U by Bank Islam",
  "fraudType": "short description e.g. QR Phishing / Lucky Draw Scam",
  "amount": ${transaction?.amount ? Math.abs(transaction.amount) : 0},
  "ref": "${transaction?.ref || 'Unknown'}",
  "merchant": "${transaction?.merchant || 'Unknown'}",
  "dateTime": "${transaction?.time || 'Unknown'}",
  "scammerContact": "phone number or name from conversation, or 'Unknown'",
  "contactMethod": "WhatsApp / SMS / Call / Email / Unknown",
  "scamMethod": "QR code / link / OTP / impersonation / other",
  "timeline": [
    { "time": "approximate time", "event": "what happened" }
  ],
  "summary": "2-3 sentences summarising the fraud for bank investigators",
  "riskLevel": "high",
  "evidenceCount": 3
}

Conversation:
${(messages || []).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}`;

  let report;

  try {
    // Pass null as system prompt — the instruction is in the message itself
    const raw = await geminiChat(null, [{ role: 'user', content: reportPrompt }], {
      temperature:     0.1,
      maxOutputTokens: 800,
    });

    try {
      report = parseGeminiJSON(raw);
    } catch {
      console.warn('[report] JSON parse failed — using fallback');
      report = buildFallbackReport(transaction);
    }

  } catch (err) {
    console.error('[report] Gemini error:', err.message);
    report = buildFallbackReport(transaction);
  }

  // Add submission routes
  report.submissionRoutes = getSubmissionRoutes(report);

  // ── Save to Supabase ──────────────────────────────────
  try {
    await saveCase(report);
  } catch (dbErr) {
    // DB failure should NOT block the response —
    // user still gets their report even if saving fails
    console.error('[report] Supabase save failed:', dbErr.message);
    console.error('[report] → Report still returned to frontend');
  }

  res.json(report);
});

module.exports = router;
