const fs = require('fs');
const path = require('path');
const pool = require('../server/db');

const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'seed.sql'), 'utf8');

pool.query(sql)
    .then(() => pool.query('SELECT COUNT(*) AS total FROM especie'))
    .then(r => console.log('Datos de ejemplo cargados. Especies en la base:', r.rows[0].total))
    .catch(e => console.error('Error:', e.message))
    .finally(() => pool.end());