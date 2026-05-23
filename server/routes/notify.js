// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// routes/notify.js — POST /api/notify
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Simulates notifying a wrong-transfer recipient.
// Saves the notification to Supabase for audit trail.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const express               = require('express');
const router                = express.Router();
const { saveNotification }  = require('../helpers/supabase');

router.post('/', async (req, res) => {
  const { transaction, senderNote } = req.body;

  const notification = {
    notificationId: `NOTIF-${Date.now()}`,
    status:         'sent',
    recipient:      transaction?.merchant || 'Recipient',
    amount:         transaction?.amount   || 0,
    ref:            transaction?.ref      || 'Unknown',
    message:        senderNote || 'This transfer was sent by mistake. Please return the funds.',
    sentAt:         new Date().toISOString(),
    expiresAt:      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  // Save to Supabase for audit trail
  try {
    await saveNotification(notification);
  } catch (dbErr) {
    console.error('[notify] Supabase save failed:', dbErr.message);
    // Still return success — notification is conceptually sent
  }

  res.json({ success: true, notification });
});

module.exports = router;
