-- Agrega nuevos tipos de negocio y columnas para etiquetas/tipo de publicacion.
-- Ejecuta este script en bases ya creadas.

ALTER TYPE negocio_tipo_enum ADD VALUE IF NOT EXISTS 'PASTELERIA';
ALTER TYPE negocio_tipo_enum ADD VALUE IF NOT EXISTS 'HELADERIA';
ALTER TYPE negocio_tipo_enum ADD VALUE IF NOT EXISTS 'PANADERIA';

ALTER TABLE negocio ADD COLUMN IF NOT EXISTS tipo_etiquetas negocio_tipo_enum[];
ALTER TABLE publicacion ADD COLUMN IF NOT EXISTS negocio_tipo_tag negocio_tipo_enum;

UPDATE negocio
SET tipo_etiquetas = ARRAY[tipo]
WHERE tipo_etiquetas IS NULL;

UPDATE publicacion p
SET negocio_tipo_tag = n.tipo
FROM negocio n
WHERE p.negocio_id = n.id
  AND p.negocio_tipo_tag IS NULL;
