-- ── SIEX compliance fields ─────────────────────────────────────────────────
-- usuario (parent table): NIF + nombre legal
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS nif          VARCHAR(20);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS nombre_legal VARCHAR(255);

-- granjero: rename num_leg → cnae, add telefono
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'granjero' AND column_name = 'num_leg'
    ) THEN
        ALTER TABLE granjero RENAME COLUMN num_leg TO cnae;
    END IF;
END $$;
ALTER TABLE granjero ADD COLUMN IF NOT EXISTS cnae     VARCHAR(10);
ALTER TABLE granjero ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- asesor: numero de colegiado
ALTER TABLE asesor ADD COLUMN IF NOT EXISTS num_colegiado VARCHAR(30);
