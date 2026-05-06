-- Backfill null unidad_medida with 'L' (most common unit for fitosanitarios)
UPDATE inventario SET unidad_medida = 'L' WHERE unidad_medida IS NULL;
