-- ============================================================
-- V12 — Tablas aplicador y equipamiento
-- ============================================================

CREATE TABLE aplicador (
    id                   BIGSERIAL    PRIMARY KEY,
    nombre               VARCHAR(255) NOT NULL,
    nif                  VARCHAR(20),
    numero_ropo          VARCHAR(50),
    nivel_capacitacion   VARCHAR(20),
    usuario_id           BIGINT       NOT NULL REFERENCES usuario(id)
);

CREATE TABLE equipamiento (
    id                   BIGSERIAL    PRIMARY KEY,
    alias                VARCHAR(255) NOT NULL,
    tipo_maquina         VARCHAR(50),
    marca_modelo         VARCHAR(255),
    num_registro_iteaf   VARCHAR(100),
    usuario_id           BIGINT       NOT NULL REFERENCES usuario(id)
);
