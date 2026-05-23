const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/chat',         require('./routes/chat'));
app.use('/api/report',       require('./routes/report'));
app.use('/api/scan',         require('./routes/scan'));
app.use('/api/notify',       require('./routes/notify'));
app.use('/api/case',         require('./routes/cases'));

app.get('/api/health', (req, res) => {
  res.json({
    status:   'ok',
    service:  'DisputeAI API',
    time:     new Date().toISOString(),
    gemini:   process.env.GEMINI_API_KEY    ? 'connected' : '⚠️ missing',
    ocr:      process.env.GOOGLE_VISION_KEY ? 'connected' : '⚠️ missing',
    supabase: process.env.SUPABASE_URL      ? 'connected' : '⚠️ missing',
  });
});

module.exports = app;