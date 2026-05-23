// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// routes/transactions.js — GET /api/transactions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Returns mock Be U transaction data.
// Production: replace with real Bank Islam API call.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const express  = require('express');
const router   = express.Router();
const mockData = require('../data/mockTransactions.json');

router.get('/', (req, res) => {
  res.json(mockData);
});

module.exports = router;
