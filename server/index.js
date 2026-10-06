const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Servir la carpeta de assets/img de forma estática
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/assets/img'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'aporte-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// ============================================================
// 1. ENDPOINT: Obtener todas las especies para el Catálogo
// ============================================================
app.get('/api/especies', async (req, res) => {
    try {
        const query = `
      SELECT 
        e.id_especie, 
        e.nombre_comun, 
        e.nombre_cientifico, 
        e.familia, 
        ft.origen,
        ft.tipo_planta,
        ft.habitat,
        COALESCE(f.ruta, '../assets/img/acacia-card.jpg') AS ruta
      FROM especie e 
      LEFT JOIN ficha_tecnica ft ON e.id_especie = ft.id_especie
      LEFT JOIN fotografia f ON e.id_especie = f.id_especie AND f.tipo = 'general'
      WHERE LOWER(e.estado) = 'activo';
    `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error SQL:', err);
        res.status(500).json({ error: 'Error al consultar especies' });
    }
});

// ============================================================
// 2. ENDPOINT: Obtener la Ficha Técnica de una especie por ID
// ============================================================
app.get('/api/especies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const especieQuery = `
      SELECT 
        e.id_especie, 
        e.nombre_comun, 
        e.nombre_cientifico, 
        e.familia, 
        e.genero,
        ft.origen, 
        ft.tipo_planta, 
        ft.rango_altitudinal, 
        ft.descripcion, 
        ft.caracteristicas, 
        ft.habitat, 
        ft.distribucion, 
        ft.importancia_ecologica,
        f.ruta
      FROM especie e
      LEFT JOIN ficha_tecnica ft ON e.id_especie = ft.id_especie
      LEFT JOIN fotografia f ON e.id_especie = f.id_especie AND f.tipo = 'general'
      WHERE e.id_especie = $1;
    `;
        const ubicacionesQuery = `SELECT sector, direccion_coordenadas FROM ubicacion WHERE id_especie = $1;`;

        const especie = await pool.query(especieQuery, [id]);
        const ubicaciones = await pool.query(ubicacionesQuery, [id]);

        if (especie.rows.length === 0) {
            return res.status(404).json({ error: 'Especie no encontrada' });
        }

        res.json({
            ...especie.rows[0],
            ubicaciones: ubicaciones.rows
        });
    } catch (err) {
        console.error('Error al consultar la ficha:', err);
        res.status(500).json({ error: 'Error al consultar la ficha técnica' });
    }
});

// ============================================================
// 3. ENDPOINT: Obtener aportes para la lista de la comunidad
// ============================================================
app.get('/api/aportes', async (req, res) => {
    try {
        const query = `
      SELECT id_aporte, descripcion, observaciones, fecha_registro 
      FROM aporte 
      ORDER BY fecha_registro DESC 
      LIMIT 10;
    `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al consultar aportes:', err);
        res.status(500).json({ error: 'Error al cargar los aportes' });
    }
});

// ============================================================
// 4. ENDPOINT: Registrar un nuevo aporte con imagen subida
// ============================================================
app.post('/api/aportes', upload.single('imagen'), async (req, res) => {
    const { planta, notas, ubicacion } = req.body;

    if (!planta || !ubicacion) {
        return res.status(400).json({ error: 'El nombre de la planta y la ubicación son obligatorios.' });
    }

    const rutaImagen = req.file
        ? `../assets/img/${req.file.filename}`
        : '../assets/img/acacia-card.jpg';

    try {
        const descripcionCompleta = `Especie: ${planta} | Sector: ${ubicacion}`;
        const query = `
      INSERT INTO aporte (id_usuario, descripcion, observaciones)
      VALUES (1, $1, $2) RETURNING *;
    `;
        const result = await pool.query(query, [descripcionCompleta, `${notas || 'Sin notas'} [Foto: ${rutaImagen}]`]);

        res.status(201).json({
            mensaje: '¡Aporte guardado con éxito!',
            aporte: result.rows[0]
        });
    } catch (err) {
        console.error('Error al guardar aporte:', err);
        res.status(500).json({ error: 'Error al guardar el reporte' });
    }
});

// Arrancar Servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});