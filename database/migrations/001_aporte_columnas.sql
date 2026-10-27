-- Separa en columnas propias los datos que antes se guardaban como texto:
--   descripcion   = 'Especie: X | Sector: Y'
--   observaciones = 'notas | Foto: ../assets/img/archivo.jpg'
-- Se puede ejecutar varias veces sin problema.

ALTER TABLE aporte
    ADD COLUMN IF NOT EXISTS planta    VARCHAR(150),
    ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(250),
    ADD COLUMN IF NOT EXISTS notas     TEXT,
    ADD COLUMN IF NOT EXISTS foto      VARCHAR(100);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'aporte' AND column_name = 'descripcion') THEN

        -- Copiar los datos de los reportes anteriores a las columnas nuevas.
UPDATE aporte SET
                  planta    = COALESCE(NULLIF(trim(substring(descripcion FROM 'Especie:([^|]*)')), ''), left(descripcion, 150)),
                  ubicacion = NULLIF(trim(substring(descripcion FROM 'Sector:(.*)$')), ''),
                  foto      = regexp_replace(substring(observaciones FROM 'Foto:\s*(\S+)'), '^.*[/\\]', ''),
                  notas     = NULLIF(NULLIF(trim(regexp_replace(COALESCE(observaciones, ''), '\s*\|?\s*Foto:\s*\S+', '', 'g')), ''), 'Sin notas')
WHERE planta IS NULL AND ubicacion IS NULL;

UPDATE aporte SET ubicacion = 'No especificada' WHERE ubicacion IS NULL;

ALTER TABLE aporte ALTER COLUMN planta SET NOT NULL;
ALTER TABLE aporte ALTER COLUMN ubicacion SET NOT NULL;

-- El código nuevo ya no escribe en estas dos columnas antiguas.
ALTER TABLE aporte ALTER COLUMN descripcion DROP NOT NULL;
END IF;
END $$;