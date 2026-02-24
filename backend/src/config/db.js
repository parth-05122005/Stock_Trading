require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'apex_trader', 
    password: process.env.DB_PASSWORD, 
    port: 5432,
});

// Export a query function that we can use throughout our app
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
