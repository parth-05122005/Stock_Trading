const db = require('../config/db');

let currentPrices = {};
exports.updatePrices = (stocks) => {
    for (const symbol in stocks) {
        currentPrices[symbol] = stocks[symbol].price;
    }
};

exports.buyStock = async (req, res) => {
    const userId = req.user.id;
    const { symbol, quantity } = req.body;
    const price = currentPrices[symbol];

    if (!price || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid stock symbol or quantity.' });
    }

    const totalCost = price * quantity;

    // Check out a dedicated client from the pool for the transaction
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const accountResult = await client.query(
            'SELECT id, balance FROM accounts WHERE user_id = $1',
            [userId]
        );
        if (accountResult.rows.length === 0) throw new Error('Account not found');
        const account = accountResult.rows[0];

        if (account.balance < totalCost) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient funds.' });
        }

        await client.query(
            'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
            [totalCost, account.id]
        );

        await client.query(`
            INSERT INTO holdings (account_id, stock_symbol, quantity, average_price)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (account_id, stock_symbol) 
            DO UPDATE SET
                quantity = holdings.quantity + EXCLUDED.quantity,
                average_price = ((holdings.average_price * holdings.quantity) + (EXCLUDED.average_price * EXCLUDED.quantity)) / (holdings.quantity + EXCLUDED.quantity);
        `, [account.id, symbol, quantity, price]);

        await client.query(
            'INSERT INTO transactions (account_id, stock_symbol, transaction_type, quantity, price, total) VALUES ($1, $2, $3, $4, $5, $6)',
            [account.id, symbol, 'BUY', quantity, price, totalCost]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: `Successfully purchased ${quantity} shares of ${symbol}.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Buy transaction failed:', error);
        res.status(500).json({ message: 'Transaction failed.' });
    } finally {
        client.release(); // Always return the client to the pool
    }
};

exports.sellStock = async (req, res) => {
    const userId = req.user.id;
    const { symbol, quantity } = req.body;
    const price = currentPrices[symbol];
    const sellQuantity = parseInt(quantity);

    if (!price || !sellQuantity || sellQuantity <= 0) {
        return res.status(400).json({ message: 'Invalid stock symbol or quantity.' });
    }

    const totalValue = price * sellQuantity;

    // Check out a dedicated client from the pool for the transaction
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const holdingResult = await client.query(`
            SELECT a.id as account_id, a.balance, h.id as holding_id, h.quantity 
            FROM accounts a
            JOIN holdings h ON a.id = h.account_id
            WHERE a.user_id = $1 AND h.stock_symbol = $2
        `, [userId, symbol]);

        if (holdingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `You do not own any shares of ${symbol}.` });
        }
        const holding = holdingResult.rows[0];

        if (holding.quantity < sellQuantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `You only own ${holding.quantity} shares.` });
        }

        await client.query(
            'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
            [totalValue, holding.account_id]
        );

        if (holding.quantity === sellQuantity) {
            await client.query('DELETE FROM holdings WHERE id = $1', [holding.holding_id]);
        } else {
            await client.query(
                'UPDATE holdings SET quantity = quantity - $1 WHERE id = $2',
                [sellQuantity, holding.holding_id]
            );
        }

        await client.query(
            'INSERT INTO transactions (account_id, stock_symbol, transaction_type, quantity, price, total) VALUES ($1, $2, $3, $4, $5, $6)',
            [holding.account_id, symbol, 'SELL', sellQuantity, price, totalValue]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: `Successfully sold ${sellQuantity} shares of ${symbol}.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Sell transaction failed:', error);
        res.status(500).json({ message: 'Sell transaction failed.' });
    } finally {
        client.release(); // Always return the client to the pool
    }
};