const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/portfolio
router.get('/', authMiddleware, portfolioController.getPortfolio);

module.exports = router;