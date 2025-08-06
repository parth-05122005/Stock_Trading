const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Use a transaction to ensure both user and account are created
        const client = await db.query('BEGIN');
        try {
            const newUserResult = await db.query(
                'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
                [email, passwordHash]
            );
            const newUser = newUserResult.rows[0];

            // Create an account for the new user with a starting balance
            await db.query('INSERT INTO accounts (user_id, balance) VALUES ($1, $2)', [newUser.id, 100000.00]);

            await db.query('COMMIT');
            res.status(201).json({
                message: 'User registered successfully!',
                user: newUser
            });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e; // Re-throw the error to be caught by the outer catch block
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

exports.login = async (req, res) => {
    // (This function remains the same as the previous step)
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const payload = { id: user.id, email: user.email };
        const token = jwt.sign(payload, 'your_jwt_secret', { expiresIn: '1h' });
        res.status(200).json({
            message: 'Logged in successfully!',
            token: token,
            user: { id: user.id, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};
