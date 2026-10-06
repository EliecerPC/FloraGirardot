const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'flora_girardot',
    password: '6326',
    port: 5432,
});

module.exports = pool;