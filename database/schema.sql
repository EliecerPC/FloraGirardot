-- Creación de Base de Datos (ejecutar por separado si no está creada)
-- CREATE DATABASE flora_girardot;

-- 1. Tabla: USUARIO
CREATE TABLE IF NOT EXISTS usuario (
                                       id_usuario SERIAL PRIMARY KEY,
                                       nombre VARCHAR(100) NOT NULL,
                                       correo VARCHAR(150) UNIQUE NOT NULL,
                                       contrasena VARCHAR(255) NOT NULL,
                                       rol VARCHAR(50) DEFAULT 'ciudadano', -- 'admin', 'investigador', 'ciudadano'
                                       estado VARCHAR(20) DEFAULT 'activo',
                                       fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla: ESPECIE
CREATE TABLE IF NOT EXISTS especie (
                                       id_especie SERIAL PRIMARY KEY,
                                       nombre_comun VARCHAR(100) NOT NULL,
                                       nombre_cientifico VARCHAR(100) UNIQUE NOT NULL,
                                       familia VARCHAR(100) NOT NULL,
                                       genero VARCHAR(100) NOT NULL,
                                       estado VARCHAR(20) DEFAULT 'activo'
);

-- 3. Tabla: FICHA_TECNICA (Relación 1:1 con ESPECIE)
CREATE TABLE IF NOT EXISTS ficha_tecnica (
                                             id_ficha SERIAL PRIMARY KEY,
                                             id_especie INT UNIQUE NOT NULL,
                                             descripcion TEXT NOT NULL,
                                             caracteristicas TEXT,
                                             habitat TEXT,
                                             distribucion TEXT,
                                             importancia_ecologica TEXT,
                                             conservacion VARCHAR(100),
                                             actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                             CONSTRAINT fk_ficha_especie FOREIGN KEY (id_especie)
                                                 REFERENCES especie(id_especie) ON DELETE CASCADE
);

-- 4. Tabla: FOTOGRAFIA (Relación 1:N con ESPECIE)
CREATE TABLE IF NOT EXISTS fotografia (
                                          id_fotografia SERIAL PRIMARY KEY,
                                          id_especie INT NOT NULL,
                                          descripcion VARCHAR(255),
                                          ruta VARCHAR(255) NOT NULL,
                                          fecha DATE DEFAULT CURRENT_DATE,
                                          autor VARCHAR(100),
                                          tipo VARCHAR(50) DEFAULT 'general', -- 'flor', 'hoja', 'corteza', 'habito'
                                          CONSTRAINT fk_foto_especie FOREIGN KEY (id_especie)
                                              REFERENCES especie(id_especie) ON DELETE CASCADE
);

-- 5. Tabla: FUENTE_BIBLIOGRAFICA
CREATE TABLE IF NOT EXISTS fuente_bibliografica (
                                                    id_fuente SERIAL PRIMARY KEY,
                                                    titulo VARCHAR(255) NOT NULL,
                                                    autor_institucion VARCHAR(200),
                                                    anio INT,
                                                    tipo VARCHAR(50), -- 'libro', 'articulo', 'informe_car'
                                                    enlace VARCHAR(255)
);

-- 6. Tabla Intermedia: ESPECIE_FUENTE (Relación N:M)
CREATE TABLE IF NOT EXISTS especie_fuente (
                                              id_especie INT NOT NULL,
                                              id_fuente INT NOT NULL,
                                              PRIMARY KEY (id_especie, id_fuente),
                                              CONSTRAINT fk_ef_especie FOREIGN KEY (id_especie)
                                                  REFERENCES especie(id_especie) ON DELETE CASCADE,
                                              CONSTRAINT fk_ef_fuente FOREIGN KEY (id_fuente)
                                                  REFERENCES fuente_bibliografica(id_fuente) ON DELETE CASCADE
);

-- 7. Tabla Intermedia: FICHA_FUENTE (Relación N:M)
CREATE TABLE IF NOT EXISTS ficha_fuente (
                                            id_ficha INT NOT NULL,
                                            id_fuente INT NOT NULL,
                                            PRIMARY KEY (id_ficha, id_fuente),
                                            CONSTRAINT fk_ff_ficha FOREIGN KEY (id_ficha)
                                                REFERENCES ficha_tecnica(id_ficha) ON DELETE CASCADE,
                                            CONSTRAINT fk_ff_fuente FOREIGN KEY (id_fuente)
                                                REFERENCES fuente_bibliografica(id_fuente) ON DELETE CASCADE
);

-- 8. Tabla: UBICACION (Relación 1:N con ESPECIE)
CREATE TABLE IF NOT EXISTS ubicacion (
                                         id_ubicacion SERIAL PRIMARY KEY,
                                         id_especie INT NOT NULL,
                                         sector VARCHAR(150) NOT NULL, -- ej. 'Parque Bolívar', 'Malecón'
                                         direccion_coordenadas VARCHAR(255), -- '4.3045, -74.8055'
                                         fecha DATE DEFAULT CURRENT_DATE,
                                         CONSTRAINT fk_ubicacion_especie FOREIGN KEY (id_especie)
                                             REFERENCES especie(id_especie) ON DELETE CASCADE
);

-- 9. Tabla: APORTE (Relación N:1 con USUARIO y ESPECIE)
CREATE TABLE IF NOT EXISTS aporte (
                                      id_aporte SERIAL PRIMARY KEY,
                                      id_usuario INT NOT NULL,
                                      id_especie INT,
                                      tipo VARCHAR(50) DEFAULT 'avistamiento', -- 'avistamiento', 'saber_local', 'foto'
                                      descripcion TEXT NOT NULL,
                                      fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                      estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'verificado', 'rechazado'
                                      observaciones TEXT,
                                      CONSTRAINT fk_aporte_usuario FOREIGN KEY (id_usuario)
                                          REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                                      CONSTRAINT fk_aporte_especie FOREIGN KEY (id_especie)
                                          REFERENCES especie(id_especie) ON DELETE SET NULL
);