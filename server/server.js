require('dotenv').config({ path: '../.env' });

const app  = require('./api');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('GET   /api/health ');
  console.log('GET   /api/transactions ');
  console.log('POST  /api/chat  - Gemini AI ');
  console.log('POST  /api/report  - Gemini AI ');
  console.log('POST  /api/scan - Google Vision OCR');
  console.log('POST  /api/notify  ');
  console.log('GET   /api/case/:id - Supabase ');

  console.log('');

  const checks = [
    ['GEMINI_API_KEY',    'Gemini AI chat'],
    ['GOOGLE_VISION_KEY', 'Google Vision OCR'],
    ['SUPABASE_URL',      'Supabase database'],
    ['SUPABASE_KEY',      'Supabase anon key'],
  ];
  checks.forEach(([key, label]) => {
    const val = process.env[key];
    const ok  = val && val !== `your_${key.toLowerCase()}_here`;
    console.log(`${ok ? '✅' : '⚠️ '} ${label}: ${ok ? 'connected' : `missing — set ${key} in .env`}`);
  });
  console.log('');
});
