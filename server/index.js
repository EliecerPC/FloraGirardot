const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Endpoint: Obtener todas las especies para el Catálogo
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
                COALESCE(f.ruta, '../public/assets/img/acacia-card.jpg') AS ruta
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

// 2. Endpoint: Obtener la Ficha Técnica de una especie por ID
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

// 3. Endpoint: Recibir un nuevo reporte comunitario
app.get('/api/especies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const especieQuery = `
            SELECT
                e.id_especie, e.nombre_comun, e.nombre_cientifico, e.familia, e.genero,
                ft.origen, ft.tipo_planta, ft.rango_altitudinal, ft.descripcion,
                ft.caracteristicas, ft.habitat, ft.distribucion, ft.importancia_ecologica,
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
        console.error(err);
        res.status(500).json({ error: 'Error al consultar la ficha técnica' });
    }
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});