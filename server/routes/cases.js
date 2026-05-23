// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// routes/cases.js — GET /api/case/:caseId
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Retrieves a stored dispute case from Supabase by ID.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const express    = require('express');
const router     = express.Router();
const { getCase } = require('../helpers/supabase');

router.get('/:caseId', async (req, res) => {
  const { caseId } = req.params;

  try {
    const caseData = await getCase(caseId);
    if (!caseData) {
      return res.status(404).json({ error: `Case ${caseId} not found` });
    }
    res.json(caseData);

  } catch (err) {
    console.error('[cases] Supabase error:', err.message);
    res.status(500).json({ error: 'Database error — try again shortly' });
  }
});

module.exports = router;
