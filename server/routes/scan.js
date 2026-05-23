// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// routes/scan.js — POST /api/scan
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Real OCR pipeline:
//   1. Google Cloud Vision extracts raw text from image
//   2. Gemini interprets the text as fraud evidence
//
// Why two steps?
//   Vision is purpose-built OCR — better at reading small
//   phone numbers and chat bubbles than Gemini Vision alone.
//   Gemini then adds intelligence on top of the raw text.
//
// Body:   { image: base64string, mimeType: "image/jpeg" }
// Returns: { found, phoneNumber, timestamp, platform,
//            messageContent, scamType, confidence, redFlags }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const express             = require('express');
const router              = express.Router();
const { scanScreenshot }  = require('../helpers/ocr');
const { getFallbackScan } = require('../helpers/fallbacks');

router.post('/', async (req, res) => {
  const { image, mimeType } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'image (base64) is required' });
  }

  try {
    const result = await scanScreenshot(image, mimeType || 'image/jpeg');
    res.json(result);

  } catch (err) {
    console.error('[scan] OCR pipeline error:', err.message);

    // Specific error messages to help debug
    if (err.message.includes('GOOGLE_VISION_KEY')) {
      console.error('[scan] → Set GOOGLE_VISION_KEY in .env');
    } else if (err.message.includes('GEMINI_API_KEY')) {
      console.error('[scan] → Set GEMINI_API_KEY in .env');
    }

    // Always return fallback so demo continues
    res.json(getFallbackScan());
  }
});

module.exports = router;
