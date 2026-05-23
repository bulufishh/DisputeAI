
const fetch = require('node-fetch');

const VISION_URL = () =>
  `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_KEY}`;

const GEMINI_URL = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

//  Extract raw text with Google Vision 
async function extractTextFromImage(base64, mimeType) {
  if (!process.env.GOOGLE_VISION_KEY) {
    throw new Error('GOOGLE_VISION_KEY not set');
  }

  const payload = {
    requests: [{
      image:    { content: base64 },
      features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
    }],
  };

  const res = await fetch(VISION_URL(), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Vision error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.responses?.[0]?.fullTextAnnotation?.text || '';
  return text;
}

// Ask Gemini to structure the raw text
async function analyseScamText(rawText) {
  if (!rawText || rawText.trim().length < 10) {
    return { found: false, reason: 'No readable text in image' };
  }

  const prompt = `You are a fraud analyst. I have extracted the following text from a screenshot.
Analyse it and return ONLY a JSON object — no markdown, no explanation.

Extracted text:
"""
${rawText}
"""

Return this exact JSON shape:
{
  "found": true,
  "phoneNumber": "phone number if visible, else null",
  "timestamp": "date/time if visible, else null",
  "platform": "WhatsApp / Telegram / SMS / Email / other — infer from content style",
  "senderName": "sender name if visible, else null",
  "messageContent": "the main scam message text, max 150 chars",
  "scamKeywords": ["array", "of", "suspicious", "words", "found"],
  "scamType": "lucky draw / investment / phishing / impersonation / job scam / other",
  "confidence": "high / medium / low",
  "redFlags": ["specific red flags you identified"]
}

If the text is clearly NOT a scam message, return:
{"found": false, "reason": "brief explanation"}`;

  const res = await fetch(GEMINI_URL(), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini analysis error: ${res.status}`);
  }

  const data  = await res.json();
  const raw   = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function scanScreenshot(base64, mimeType) {
  //  Extract raw text
  const rawText = await extractTextFromImage(base64, mimeType);
  console.log(`[ocr] Extracted ${rawText.length} chars from image`);

  // Gemini analyses the text
  const result = await analyseScamText(rawText);
  console.log(`[ocr] Analysis — found: ${result.found}, type: ${result.scamType || 'n/a'}`);

  // Include the raw OCR text for debugging/evidence logging
  result.rawText = rawText.substring(0, 500); 
  return result;
}

module.exports = { scanScreenshot, extractTextFromImage, analyseScamText };
