const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'apex_trader', 
    password: 'parth', 
    port: 5432,
});

// Export a query function that we can use throughout our app
module.exports = {
    query: (text, params) => pool.query(text, params),
};
