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
    const r = await pool.query(
        'SELECT id_aporte, planta, ubicacion, notas, foto, estado FROM aporte ORDER BY id_aporte'
    );
    console.table(r.rows);
})().catch(e => console.error('Error:', e.message)).finally(() => pool.end());