-- ============================================================
-- V5__recinto.sql — Introducción de la entidad Recinto (SIGPAC)
--
-- La unidad mínima de declaración SIEX/SIGPAC es el Recinto,
-- no la Parcela. Este script:
--   1. Crea la tabla `recinto`.
--   2. Por cada parcela existente crea un recinto por defecto
--      que hereda cultivo y superficie para no perder datos.
--   3. Añade la columna recinto_id a tratamiento y la rellena.
--   4. Elimina parcela_id de tratamiento (ya obsoleto).
--   5. Elimina superficie y cultivo de parcela (movidos al recinto).
--   6. Añade los campos SIGPAC a parcela.
-- ============================================================

-- 1. Crear tabla recinto si no existe
CREATE TABLE IF NOT EXISTS recinto (
    id               BIGSERIAL        PRIMARY KEY,
    numero_recinto   INTEGER          NOT NULL,
    superficie       NUMERIC(10, 4),
    uso_sigpac       VARCHAR(10),
    sistema_cultivo  VARCHAR(50),
    cultivo          VARCHAR(10),
    parcela_id       BIGINT           NOT NULL REFERENCES parcela(id),
    created_at       TIMESTAMP        NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP        NOT NULL DEFAULT now()
);

-- 2. Crear recintos por defecto (solo para parcelas que no tengan ya uno)
INSERT INTO recinto (numero_recinto, superficie, uso_sigpac, sistema_cultivo, cultivo, parcela_id)
SELECT 1, 0.0, 'TA', 'SE', '00', p.id
FROM parcela p
WHERE NOT EXISTS (SELECT 1 FROM recinto r WHERE r.parcela_id = p.id);

-- 3. Preparar la tabla tratamiento
ALTER TABLE tratamiento ADD COLUMN IF NOT EXISTS recinto_id BIGINT REFERENCES recinto(id);

-- 4. BLOQUE DE MIGRACIÓN SEGURO (Solo actualiza si existe parcela_id)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='tratamiento' AND column_name='parcela_id') THEN
        
        UPDATE tratamiento t
        SET    recinto_id = r.id
        FROM   recinto r
        WHERE  r.parcela_id = t.parcela_id
          AND  r.numero_recinto = 1;
          
    END IF;
END $$;

-- 5. Asegurar que los tratamientos tengan un recinto (aunque sea el de por defecto)
UPDATE tratamiento SET recinto_id = (SELECT id FROM recinto WHERE numero_recinto = 1 LIMIT 1)
WHERE recinto_id IS NULL;

-- 6. Restricción NOT NULL
ALTER TABLE tratamiento ALTER COLUMN recinto_id SET NOT NULL;

-- 7. Limpieza final de columnas antiguas (si existen)
ALTER TABLE tratamiento DROP COLUMN IF EXISTS parcela_id;
ALTER TABLE parcela DROP COLUMN IF EXISTS superficie;
ALTER TABLE parcela DROP COLUMN IF EXISTS superficie_ha;
ALTER TABLE parcela DROP COLUMN IF EXISTS cultivo;

-- 8. Asegurar campos SIGPAC en parcela (evitando errores si ya existen)
ALTER TABLE parcela ADD COLUMN IF NOT EXISTS provincia VARCHAR(100);
ALTER TABLE parcela ADD COLUMN IF NOT EXISTS agregado INTEGER;
ALTER TABLE parcela ADD COLUMN IF NOT EXISTS zona INTEGER;
ALTER TABLE parcela ADD COLUMN IF NOT EXISTS poligono INTEGER;
ALTER TABLE parcela ADD COLUMN IF NOT EXISTS parcela_sigpac INTEGER;