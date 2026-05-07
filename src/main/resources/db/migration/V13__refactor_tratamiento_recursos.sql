-- ============================================================
-- V13 — Normalizar tratamiento: reemplazar campos de texto por
--        FK a las tablas aplicador y equipamiento
-- ============================================================

ALTER TABLE tratamiento
    DROP COLUMN IF EXISTS nif_aplicador,
    DROP COLUMN IF EXISTS numero_ropo,
    DROP COLUMN IF EXISTS nivel_capacitacion_ropo,
    DROP COLUMN IF EXISTS num_registro_iteaf,
    DROP COLUMN IF EXISTS tipo_equipo,
    DROP COLUMN IF EXISTS fecha_iteaf;

ALTER TABLE tratamiento
    ADD COLUMN IF NOT EXISTS aplicador_id   BIGINT REFERENCES aplicador(id),
    ADD COLUMN IF NOT EXISTS equipamiento_id BIGINT REFERENCES equipamiento(id);
