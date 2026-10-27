-- Las columnas "descripcion" y "observaciones" fueron reemplazadas por
-- planta, ubicacion, notas y foto (ver 001_aporte_columnas.sql).
ALTER TABLE aporte
DROP COLUMN IF EXISTS descripcion,
    DROP COLUMN IF EXISTS observaciones;