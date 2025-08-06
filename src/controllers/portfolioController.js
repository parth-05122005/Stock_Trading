const db = require('../config/db');

exports.getPortfolio = async (req, res) => {
    const userId = req.user.id;
    try {
        const portfolioData = await db.query(`
            SELECT 
                a.balance,
                h.stock_symbol,
                h.quantity,
                h.average_price
            FROM accounts a
            LEFT JOIN holdings h ON a.id = h.account_id
            WHERE a.user_id = $1;
        `, [userId]);

        const balance = portfolioData.rows.length > 0 ? portfolioData.rows[0].balance : 0;
        const holdings = portfolioData.rows
            .filter(r => r.stock_symbol) // Filter out rows with no holdings
            .map(r => ({
                symbol: r.stock_symbol,
                quantity: r.quantity,
                avgPrice: parseFloat(r.average_price)
            }));
        
        res.json({ balance: parseFloat(balance), holdings });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ message: 'Error fetching portfolio data.' });
    }
};