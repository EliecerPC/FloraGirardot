-- Foto de perfil de cada usuario (nombre del archivo en uploads/perfiles/).
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(100);