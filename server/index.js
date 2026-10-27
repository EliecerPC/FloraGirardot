require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const PgSession = require('connect-pg-simple')(session);

// En producción no se permite arrancar con la clave de sesión por defecto.
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.error('Falta SESSION_SECRET en el .env. El servidor no arranca en producción sin ella.');
    process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT || 3000);
const frontendOrigins = (process.env.FRONTEND_URL || 'http://127.0.0.1:5500,http://localhost:5500')
    .split(',').map(origin => origin.trim()).filter(Boolean);

app.use(helmet({
    // Las fotos se sirven desde el puerto 3000 y se muestran en páginas de otro origen (5500).
    // Con el valor por defecto de helmet, el navegador las bloquearía.
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
    origin(origin, callback) {
        if (!origin || frontendOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    name: 'floragirardot.sid',
    secret: process.env.SESSION_SECRET || 'solo-desarrollo-cambiar-antes-de-publicar',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 8
    }
}));

// Mantener disponible la carpeta de recursos públicos existente.
app.use('/assets', express.static(path.join(__dirname, '../public/assets'), {
    setHeaders: res => res.setHeader('X-Content-Type-Options', 'nosniff')
}));
const imageDirectory = path.join(__dirname, '../public/assets/img');
fs.mkdirSync(imageDirectory, { recursive: true });

const EXTENSIONES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, imageDirectory),
    filename: (_req, file, cb) => {
        const ext = EXTENSIONES[file.mimetype];
        cb(null, 'aporte-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            return cb(new Error('La imagen debe estar en formato JPG, PNG o WEBP.'));
        }
        cb(null, true);
    }
});

// Comprueba los primeros bytes del archivo: el mimetype lo declara el cliente y puede mentir.
function firmaValida(rutaArchivo, mimetype) {
    const buf = Buffer.alloc(12);
    const fd = fs.openSync(rutaArchivo, 'r');
    try {
        fs.readSync(fd, buf, 0, 12, 0);
    } finally {
        fs.closeSync(fd);
    }
    if (mimetype === 'image/jpeg') return buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    if (mimetype === 'image/png') {
        return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    }
    if (mimetype === 'image/webp') {
        return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
    }
    return false;
}

// -------------------- Límites de intentos --------------------
const mensajeLimite = { error: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' };

// Solo cuentan los intentos fallidos: 10 cada 15 minutos por IP.
const limitarLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: mensajeLimite
});

// 10 cuentas nuevas por hora y por IP.
const limitarRegistro = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: mensajeLimite
});

// 20 reportes con foto por hora y por IP (evita llenar el disco).
const limitarSubidas = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Has enviado demasiados reportes. Inténtalo más tarde.' }
});

// -------------------- Autenticación y permisos --------------------
function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'Debes iniciar sesión para realizar esta acción.' });
    next();
}
function requireReviewer(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'Debes iniciar sesión.' });
    if (!['admin', 'investigador'].includes(req.session.user.rol)) {
        return res.status(403).json({ error: 'No tienes permisos para revisar reportes.' });
    }
    next();
}

// El registro público crea exclusivamente cuentas de ciudadano.
app.post('/api/auth/registro', limitarRegistro, async (req, res) => {
    const nombre = String(req.body.nombre || '').trim();
    const correo = String(req.body.correo || '').trim().toLowerCase();
    const contrasena = String(req.body.contrasena || '');

    if (nombre.length < 2 || nombre.length > 100) {
        return res.status(400).json({ error: 'El nombre debe tener entre 2 y 100 caracteres.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 150) {
        return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
    }
    if (contrasena.length < 8 || contrasena.length > 72) {
        return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 72 caracteres.' });
    }

    try {
        const hash = await bcrypt.hash(contrasena, 12);
        const result = await pool.query(
            "INSERT INTO usuario (nombre, correo, contrasena, rol, estado) VALUES ($1, $2, $3, 'ciudadano', 'activo') RETURNING id_usuario, nombre, correo, rol",
            [nombre, correo, hash]
        );
        req.session.user = result.rows[0];
        req.session.save(err => {
            if (err) return res.status(500).json({ error: 'La cuenta se creó, pero no fue posible iniciar sesión.' });
            res.status(201).json({ mensaje: 'Cuenta creada correctamente.', usuario: req.session.user });
        });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
        console.error('Error al registrar usuario:', err);
        res.status(500).json({ error: 'No fue posible crear la cuenta.' });
    }
});

app.post('/api/auth/login', limitarLogin, async (req, res) => {
    const correo = String(req.body.correo || '').trim().toLowerCase();
    const contrasena = String(req.body.contrasena || '');
    try {
        const result = await pool.query(
            'SELECT id_usuario, nombre, correo, contrasena, rol, estado FROM usuario WHERE correo = $1',
            [correo]
        );
        const usuario = result.rows[0];
        if (!usuario || usuario.estado !== 'activo' || !(await bcrypt.compare(contrasena, usuario.contrasena))) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos, o cuenta inactiva.' });
        }
        req.session.regenerate(err => {
            if (err) return res.status(500).json({ error: 'No fue posible iniciar sesión.' });
            req.session.user = {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            };
            req.session.save(saveErr => {
                if (saveErr) return res.status(500).json({ error: 'No fue posible guardar la sesión.' });
                res.json({ mensaje: 'Sesión iniciada.', usuario: req.session.user });
            });
        });
    } catch (err) {
        console.error('Error al iniciar sesión:', err);
        res.status(500).json({ error: 'No fue posible iniciar sesión.' });
    }
});

app.get('/api/auth/me', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No has iniciado sesión.' });
    res.json({ usuario: req.session.user });
});
app.post('/api/auth/logout', (req, res) => {
    if (!req.session) return res.json({ mensaje: 'Sesión cerrada.' });
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'No fue posible cerrar la sesión.' });
        res.clearCookie('floragirardot.sid', {
            httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production'
        });
        res.json({ mensaje: 'Sesión cerrada.' });
    });
});

// -------------------- Consulta pública de especies --------------------
app.get('/api/especies', async (_req, res) => {
    try {
        const query = "SELECT e.id_especie, e.nombre_comun, e.nombre_cientifico, e.familia, ft.origen, ft.tipo_planta, ft.habitat, COALESCE(f.ruta, '../assets/img/acacia-card.jpg') AS ruta FROM especie e LEFT JOIN ficha_tecnica ft ON e.id_especie = ft.id_especie LEFT JOIN fotografia f ON e.id_especie = f.id_especie AND f.tipo = 'general' WHERE LOWER(e.estado) = 'activo'";
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error SQL:', err);
        res.status(500).json({ error: 'Error al consultar especies.' });
    }
});

app.get('/api/especies/:id', async (req, res) => {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Identificador inválido.' });
    try {
        const especieQuery = "SELECT e.id_especie, e.nombre_comun, e.nombre_cientifico, e.familia, e.genero, ft.origen, ft.tipo_planta, ft.rango_altitudinal, ft.descripcion, ft.caracteristicas, ft.habitat, ft.distribucion, ft.importancia_ecologica, f.ruta FROM especie e LEFT JOIN ficha_tecnica ft ON e.id_especie = ft.id_especie LEFT JOIN fotografia f ON e.id_especie = f.id_especie AND f.tipo = 'general' WHERE e.id_especie = $1";
        const [especie, ubicaciones] = await Promise.all([
            pool.query(especieQuery, [id]),
            pool.query('SELECT sector, direccion_coordenadas FROM ubicacion WHERE id_especie = $1', [id])
        ]);
        if (!especie.rows.length) return res.status(404).json({ error: 'Especie no encontrada.' });
        res.json({ ...especie.rows[0], ubicaciones: ubicaciones.rows });
    } catch (err) {
        console.error('Error al consultar la ficha:', err);
        res.status(500).json({ error: 'Error al consultar la ficha técnica.' });
    }
});

// Solo los reportes verificados son visibles públicamente.
app.get('/api/aportes', async (_req, res) => {
    try {
        const result = await pool.query(
            "SELECT a.id_aporte, a.descripcion, a.observaciones, a.fecha_envio, u.nombre AS autor FROM aporte a JOIN usuario u ON u.id_usuario = a.id_usuario WHERE a.estado = 'verificado' ORDER BY a.fecha_envio DESC LIMIT 50"
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al consultar aportes públicos:', err);
        res.status(500).json({ error: 'Error al cargar los reportes.' });
    }
});

app.get('/api/mis-aportes', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id_aporte, descripcion, observaciones, fecha_envio, estado FROM aporte WHERE id_usuario = $1 ORDER BY fecha_envio DESC',
            [req.session.user.id_usuario]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al consultar reportes del usuario:', err);
        res.status(500).json({ error: 'Error al cargar tus reportes.' });
    }
});

// Autenticación antes de procesar cualquier archivo enviado.
app.post('/api/aportes', limitarSubidas, requireAuth, (req, res, next) => {
    upload.single('imagen')(req, res, err => {
        if (err) return res.status(400).json({ error: err.message || 'No fue posible procesar la imagen.' });
        next();
    });
}, async (req, res) => {
    if (req.file && !firmaValida(req.file.path, req.file.mimetype)) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'El archivo no es una imagen válida.' });
    }
    const planta = String(req.body.planta || '').trim();
    const notas = String(req.body.notas || '').trim();
    const ubicacion = String(req.body.ubicacion || '').trim();
    if (!planta || !ubicacion) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'El nombre de la planta y la ubicación son obligatorios.' });
    }
    if (planta.length > 150 || ubicacion.length > 250 || notas.length > 5000) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'Uno de los campos supera la longitud permitida.' });
    }
    const rutaImagen = req.file ? '../assets/img/' + req.file.filename : '';
    const descripcion = 'Especie: ' + planta + ' | Sector: ' + ubicacion;
    const observaciones = [notas || 'Sin notas', rutaImagen ? 'Foto: ' + rutaImagen : ''].filter(Boolean).join(' | ');
    try {
        const result = await pool.query(
            "INSERT INTO aporte (id_usuario, descripcion, observaciones, estado) VALUES ($1, $2, $3, 'pendiente') RETURNING id_aporte, descripcion, observaciones, fecha_envio, estado",
            [req.session.user.id_usuario, descripcion, observaciones]
        );
        res.status(201).json({ mensaje: 'Reporte enviado. Quedará pendiente de revisión.', aporte: result.rows[0] });
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {});
        console.error('Error al guardar aporte:', err);
        res.status(500).json({ error: 'Error al guardar el reporte.' });
    }
});

// Bandeja y acciones reservadas para administradores y revisores científicos.
app.get('/api/admin/aportes', requireReviewer, async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT a.id_aporte, a.descripcion, a.observaciones, a.fecha_envio, a.estado, u.nombre AS autor, u.correo AS correo_autor FROM aporte a JOIN usuario u ON u.id_usuario = a.id_usuario ORDER BY a.fecha_envio DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al consultar bandeja de revisión:', err);
        res.status(500).json({ error: 'Error al cargar la bandeja de revisión.' });
    }
});

app.patch('/api/admin/aportes/:id/estado', requireReviewer, async (req, res) => {
    const id = req.params.id;
    const estado = req.body.estado;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Identificador inválido.' });
    if (!['verificado', 'rechazado', 'requiere_correccion'].includes(estado)) {
        return res.status(400).json({ error: 'Estado no permitido.' });
    }
    try {
        const result = await pool.query(
            'UPDATE aporte SET estado = $1 WHERE id_aporte = $2 RETURNING id_aporte, estado',
            [estado, id]
        );
        if (!result.rowCount) return res.status(404).json({ error: 'Reporte no encontrado.' });
        res.json({ mensaje: 'Estado del reporte actualizado.', aporte: result.rows[0] });
    } catch (err) {
        console.error('Error al actualizar estado del reporte:', err);
        res.status(500).json({ error: 'No fue posible actualizar el reporte.' });
    }
});

app.use((err, _req, res, _next) => {
    console.error('Error del servidor:', err.message);
    if (res.headersSent) return;
    res.status(400).json({ error: 'No fue posible procesar la solicitud.' });
});

app.listen(PORT, () => {
    console.log('Servidor corriendo en http://localhost:' + PORT);
    if (!process.env.SESSION_SECRET) {
        console.warn('AVISO: falta SESSION_SECRET en el .env; se usa una clave de desarrollo.');
    }
});