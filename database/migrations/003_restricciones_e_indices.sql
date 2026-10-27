-- Restricciones de valores e índices para las consultas más frecuentes.
-- Se puede ejecutar varias veces sin problema.

-- Unificar mayúsculas/minúsculas antes de restringir los valores.
UPDATE usuario SET rol = LOWER(rol) WHERE rol <> LOWER(rol);
UPDATE usuario SET estado = LOWER(estado) WHERE estado <> LOWER(estado);
UPDATE especie SET estado = LOWER(estado) WHERE estado <> LOWER(estado);

-- Restricciones de valores
ALTER TABLE usuario DROP CONSTRAINT IF EXISTS ck_usuario_rol;
ALTER TABLE usuario ADD CONSTRAINT ck_usuario_rol
    CHECK (rol IN ('ciudadano', 'investigador', 'admin'));

ALTER TABLE usuario DROP CONSTRAINT IF EXISTS ck_usuario_estado;
ALTER TABLE usuario ADD CONSTRAINT ck_usuario_estado
    CHECK (estado IN ('activo', 'inactivo', 'suspendido'));

ALTER TABLE especie DROP CONSTRAINT IF EXISTS ck_especie_estado;
ALTER TABLE especie ADD CONSTRAINT ck_especie_estado
    CHECK (estado IN ('activo', 'inactivo'));

ALTER TABLE aporte DROP CONSTRAINT IF EXISTS ck_aporte_estado;
ALTER TABLE aporte ADD CONSTRAINT ck_aporte_estado
    CHECK (estado IN ('pendiente', 'verificado', 'rechazado', 'requiere_correccion'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_aporte_estado_fecha  ON aporte (estado, fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_aporte_usuario_fecha ON aporte (id_usuario, fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_aporte_especie       ON aporte (id_especie);
CREATE INDEX IF NOT EXISTS idx_fotografia_especie_tipo ON fotografia (id_especie, tipo, id_fotografia);
CREATE INDEX IF NOT EXISTS idx_ubicacion_especie    ON ubicacion (id_especie);