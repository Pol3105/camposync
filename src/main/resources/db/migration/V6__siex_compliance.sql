-- ============================================================
-- V6__siex_compliance.sql — Cumplimiento normativa SIEX
--
-- Añade los campos obligatorios SIEX a tres tablas:
--   · explotacion   → REA, tipo, orientación, provincia/municipio INE, año
--   · tratamiento   → motivo, plaga EPPO, equipo, ITEAF, ROPO, aplicador
--   · producto_fitosanitario → dosis oficiales MAPA
--
-- Todas las columnas son NULLABLE para no romper datos existentes.
-- La columna cultivo se elimina de explotacion (está en recinto).
-- superficie_ha se renombra a superficie_total (BigDecimal).
-- ============================================================

-- ── EXPLOTACION ──────────────────────────────────────────────────────────────
-- Añadir la nueva columna
ALTER TABLE explotacion ADD COLUMN IF NOT EXISTS superficie_total NUMERIC(10, 4);

-- Migración segura de datos: Usa SQL Dinámico (EXECUTE) para que el parser no falle si no existe
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='explotacion' AND column_name='superficie_ha') THEN
        EXECUTE 'UPDATE explotacion SET superficie_total = CAST(superficie_ha AS NUMERIC(10, 4)) WHERE superficie_total IS NULL';
        EXECUTE 'ALTER TABLE explotacion DROP COLUMN superficie_ha';
    END IF;
END $$;

-- Eliminar cultivo (migrado a recinto)
ALTER TABLE explotacion DROP COLUMN IF EXISTS cultivo;

-- Campos SIEX obligatorios
ALTER TABLE explotacion ADD COLUMN IF NOT EXISTS codigo_rea              VARCHAR(20);
ALTER TABLE explotacion ADD COLUMN IF NOT EXISTS tipo_explotacion        VARCHAR(2);
ALTER TABLE explotacion ADD COLUMN IF NOT EXISTS orientacion_productiva  VARCHAR(4);
ALTER TABLE explotacion ADD COLUMN IF NOT EXISTS provincia_explotacion   VARCHAR(2);
ALTER TABLE explotacion ADD COLUMN IF NOT EXISTS municipio_explotacion   VARCHAR(5);
ALTER TABLE explotacion ADD COLUMN IF NOT EXISTS anio_declaracion        INTEGER;

-- ── TRATAMIENTO ──────────────────────────────────────────────────────────────

-- Eliminar campo genérico (reemplazado por tipo_equipo)
ALTER TABLE tratamiento DROP COLUMN IF EXISTS equipo_aplicacion;

-- Campos SIEX
ALTER TABLE tratamiento ADD COLUMN IF NOT EXISTS motivo_tratamiento        VARCHAR(2);
ALTER TABLE tratamiento ADD COLUMN IF NOT EXISTS codigo_plaga              VARCHAR(50);
ALTER TABLE tratamiento ADD COLUMN IF NOT EXISTS tipo_equipo               VARCHAR(50);
ALTER TABLE tratamiento ADD COLUMN IF NOT EXISTS num_registro_iteaf        VARCHAR(50);
ALTER TABLE tratamiento ADD COLUMN IF NOT EXISTS fecha_iteaf               DATE;
ALTER TABLE tratamiento ADD COLUMN IF NOT EXISTS volumen_caldo             NUMERIC(10, 2);
ALTER TABLE tratamiento ADD COLUMN IF NOT EXISTS nif_aplicador             VARCHAR(15);
ALTER TABLE tratamiento ADD COLUMN IF NOT EXISTS numero_ropo               VARCHAR(50);
ALTER TABLE tratamiento ADD COLUMN IF NOT EXISTS nivel_capacitacion_ropo   VARCHAR(2);

-- ── PRODUCTO FITOSANITARIO ───────────────────────────────────────────────────

ALTER TABLE producto_fitosanitario ADD COLUMN IF NOT EXISTS dosis_min            NUMERIC(10, 4);
ALTER TABLE producto_fitosanitario ADD COLUMN IF NOT EXISTS dosis_max            NUMERIC(10, 4);
ALTER TABLE producto_fitosanitario ADD COLUMN IF NOT EXISTS unidad_dosis_oficial VARCHAR(20);
