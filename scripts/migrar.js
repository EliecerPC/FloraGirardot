const fs = require('fs');
const path = require('path');
const pool = require('../server/db');

const carpeta = path.join(__dirname, '..', 'database', 'migrations');
const archivos = fs.readdirSync(carpeta).filter(f => f.endsWith('.sql')).sort();

(async () => {
    for (const archivo of archivos) {
        await pool.query(fs.readFileSync(path.join(carpeta, archivo), 'utf8'));
        console.log('Aplicada: ' + archivo);
    }

    const restricciones = await pool.query(
        `SELECT conrelid::regclass AS tabla, conname AS restriccion
         FROM pg_constraint
         WHERE contype = 'c' AND conname LIKE 'ck%'
         ORDER BY 1, 2`
    );
    console.log('\nRestricciones de valores:');
    console.table(restricciones.rows);

    const indices = await pool.query(
        `SELECT tablename AS tabla, indexname AS indice
         FROM pg_indexes
         WHERE schemaname = 'public' AND indexname LIKE 'idx%'
         ORDER BY 1, 2`
    );
    console.log('Índices:');
    console.table(indices.rows);
})().catch(e => console.error('Error:', e.message)).finally(() => pool.end());