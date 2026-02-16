const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/trade/buy
router.post('/buy', authMiddleware, tradeController.buyStock);

// NEW: POST /api/trade/sell
router.post('/sell', authMiddleware, tradeController.sellStock);

module.exports = router;
