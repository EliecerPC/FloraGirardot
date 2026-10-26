-- DATOS DE EJEMPLO SOLO PARA PRUEBAS.
-- Los textos son genéricos y las coordenadas aproximadas: verificar antes de publicar.
-- Se puede ejecutar varias veces sin duplicar registros.

INSERT INTO especie (nombre_comun, nombre_cientifico, familia, genero) VALUES
                                                                           ('Acacia roja', 'Delonix regia',        'Fabaceae',      'Delonix'),
                                                                           ('Caracolí',    'Anacardium excelsum',  'Anacardiaceae', 'Anacardium'),
                                                                           ('Diomate',     'Astronium graveolens', 'Anacardiaceae', 'Astronium'),
                                                                           ('Guácimo',     'Guazuma ulmifolia',    'Malvaceae',     'Guazuma'),
                                                                           ('Iguá',        'Albizia guachapele',   'Fabaceae',      'Albizia')
    ON CONFLICT (nombre_cientifico) DO NOTHING;

INSERT INTO ficha_tecnica
(id_especie, origen, tipo_planta, rango_altitudinal, descripcion, caracteristicas, habitat, distribucion, importancia_ecologica)
SELECT e.id_especie, v.origen, v.tipo_planta, v.rango, v.descripcion, v.caracteristicas, v.habitat, v.distribucion, v.importancia
FROM (VALUES
          ('Delonix regia', 'Introducida', 'Árbol', '0 - 1000 m s. n. m.',
           'Árbol ornamental de copa amplia y flores rojas, muy usado como sombra en parques y calles. (Texto de prueba)',
           'Copa en forma de sombrilla, hojas compuestas y flores rojas. (Texto de prueba)',
           'Zonas urbanas y bosque seco tropical', 'Parques y avenidas de Girardot',
           'Ofrece sombra y alimento a polinizadores y aves. (Texto de prueba)'),
          ('Anacardium excelsum', 'Nativa', 'Árbol', '0 - 1000 m s. n. m.',
           'Árbol grande de tronco recto, típico de zonas cálidas del país. (Texto de prueba)',
           'Tronco robusto, copa densa y hojas grandes. (Texto de prueba)',
           'Ribera y bosque húmedo', 'Orillas del río y zonas bajas',
           'Aporta sombra, refugio para fauna y protege el suelo. (Texto de prueba)'),
          ('Astronium graveolens', 'Nativa', 'Árbol', '0 - 1000 m s. n. m.',
           'Árbol nativo de bosque seco, apreciado por su madera. (Texto de prueba)',
           'Tronco recto y corteza que se desprende en placas. (Texto de prueba)',
           'Bosque seco tropical', 'Remanentes de bosque seco de la región',
           'Mantiene la estructura del bosque seco y sirve de refugio a fauna. (Texto de prueba)'),
          ('Guazuma ulmifolia', 'Nativa', 'Árbol', '0 - 1200 m s. n. m.',
           'Árbol de crecimiento rápido, común en potreros y zonas abiertas. (Texto de prueba)',
           'Copa abierta, hojas ásperas y frutos pequeños oscuros. (Texto de prueba)',
           'Bosque seco y ribera', 'Zonas abiertas y vías',
           'Sus frutos alimentan a fauna silvestre y ganado. (Texto de prueba)'),
          ('Albizia guachapele', 'Nativa', 'Árbol', '0 - 1000 m s. n. m.',
           'Árbol leguminoso de bosque seco con hojas compuestas. (Texto de prueba)',
           'Copa amplia y vainas alargadas. (Texto de prueba)',
           'Bosque seco tropical', 'Zonas secas del valle del Magdalena',
           'Como leguminosa, ayuda a fijar nitrógeno en el suelo. (Texto de prueba)')
     ) AS v(nombre_cientifico, origen, tipo_planta, rango, descripcion, caracteristicas, habitat, distribucion, importancia)
         JOIN especie e ON e.nombre_cientifico = v.nombre_cientifico
    ON CONFLICT (id_especie) DO NOTHING;

INSERT INTO fotografia (id_especie, descripcion, ruta, autor, tipo)
SELECT e.id_especie, 'Fotografía general', v.ruta, 'Proyecto FloraGirardot', 'general'
FROM (VALUES
          ('Delonix regia',        '../public/assets/img/acacia-card.jpg'),
          ('Anacardium excelsum',  '../public/assets/img/caracoli-card.jpg'),
          ('Astronium graveolens', '../public/assets/img/diomate-card.jpg'),
          ('Guazuma ulmifolia',    '../public/assets/img/guacimo-card.jpg'),
          ('Albizia guachapele',   '../public/assets/img/igua-card.jpg')
     ) AS v(nombre_cientifico, ruta)
         JOIN especie e ON e.nombre_cientifico = v.nombre_cientifico
WHERE NOT EXISTS (
    SELECT 1 FROM fotografia f WHERE f.id_especie = e.id_especie AND f.tipo = 'general'
);

INSERT INTO ubicacion (id_especie, sector, direccion_coordenadas)
SELECT e.id_especie, v.sector, v.coordenadas
FROM (VALUES
          ('Delonix regia',        'Parque Bolívar',  '4.3045, -74.8055'),
          ('Delonix regia',        'Malecón',         '4.3012, -74.8021'),
          ('Anacardium excelsum',  'Malecón',         '4.3002, -74.8030'),
          ('Astronium graveolens', 'Parque Bolívar',  '4.3051, -74.8047'),
          ('Guazuma ulmifolia',    'Centro',          '4.3030, -74.8070'),
          ('Albizia guachapele',   'Malecón',         '4.2995, -74.8015')
     ) AS v(nombre_cientifico, sector, coordenadas)
         JOIN especie e ON e.nombre_cientifico = v.nombre_cientifico
WHERE NOT EXISTS (
    SELECT 1 FROM ubicacion u WHERE u.id_especie = e.id_especie AND u.sector = v.sector
);