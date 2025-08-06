const { Pool } = require('pg');

// Create a new connection pool.
// A pool is better than a single client for handling multiple concurrent connections.
const pool = new Pool({
    user: 'postgres', // Or your postgres username
    host: 'localhost',
    database: 'apex_trader', // The database you created
    password: 'parth', // The password you set during installation
    port: 5432,
});

// We'll export a query function that we can use throughout our app
module.exports = {
    query: (text, params) => pool.query(text, params),
};
