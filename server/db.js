require('dotenv').config();
const { Pool } = require('pg');

// Las credenciales se configuran en el archivo .env local.
// No guardar contraseñas reales en el repositorio.
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'flora_girardot',
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 5432),
});

module.exports = pool;