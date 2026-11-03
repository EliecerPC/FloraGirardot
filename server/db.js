
require('dotenv').config();
const { Pool } = require('pg');

// Si existe DATABASE_URL, se conecta a Neon.
// Si no, utiliza la configuración de PostgreSQL local.
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    })
    : new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'flora_girardot',
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT || 5432),
    });

// Evita que un error inesperado de conexión cierre el servidor.
pool.on('error', err => {
    console.error('Error inesperado en la conexión con PostgreSQL:', err.message);
});

module.exports = pool;
