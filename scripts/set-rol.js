const pool = require('../server/db');

const [correo, rol = 'admin'] = process.argv.slice(2);
if (!correo || !['admin', 'investigador', 'ciudadano'].includes(rol)) {
    console.log('Uso: node scripts/set-rol.js correo@ejemplo.com [admin|investigador|ciudadano]');
    process.exit(1);
}

pool.query('UPDATE usuario SET rol = $1 WHERE correo = $2', [rol, correo.toLowerCase()])
    .then(r => console.log(r.rowCount ? 'Rol actualizado.' : 'No existe un usuario con ese correo.'))
    .catch(e => console.error('Error:', e.message))
    .finally(() => pool.end());