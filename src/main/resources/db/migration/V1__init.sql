-- ============================================================
-- V1__init.sql — Esquema inicial CampoSync
-- ============================================================

CREATE TABLE plan (
    id               BIGSERIAL PRIMARY KEY,
    nombre           VARCHAR(255) NOT NULL,
    limite_explotaciones INTEGER  NOT NULL,
    precio_mensual   FLOAT        NOT NULL,
    is_default       BOOLEAN      NOT NULL DEFAULT FALSE,
    stripe_price_id  VARCHAR(255),
    created_at       TIMESTAMP    NOT NULL,
    updated_at       TIMESTAMP    NOT NULL
);

CREATE TABLE asesoria (
    id                  BIGSERIAL PRIMARY KEY,
    nombre              VARCHAR(255) NOT NULL,
    provincia           VARCHAR(255),
    telefono            VARCHAR(255),
    email               VARCHAR(255) NOT NULL UNIQUE,
    plan_id             BIGINT       NOT NULL REFERENCES plan(id),
    activo              BOOLEAN      NOT NULL DEFAULT TRUE,
    stripe_customer_id  VARCHAR(255),
    created_at          TIMESTAMP    NOT NULL,
    updated_at          TIMESTAMP    NOT NULL
);

CREATE TABLE invitacion (
    token           VARCHAR(255) PRIMARY KEY,
    email_invitado  VARCHAR(255) NOT NULL,
    estado          VARCHAR(50)  NOT NULL,
    expira_en       TIMESTAMP    NOT NULL,
    asesoria_id     BIGINT       NOT NULL REFERENCES asesoria(id),
    created_at      TIMESTAMP    NOT NULL
);

CREATE TABLE usuario (
    id          BIGSERIAL    PRIMARY KEY,
    username    VARCHAR(255) NOT NULL UNIQUE,
    passwd      VARCHAR(255) NOT NULL,
    discrimi    VARCHAR(31)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP    NOT NULL
);

CREATE TABLE asesor (
    id          BIGINT  PRIMARY KEY REFERENCES usuario(id),
    asesoria_id BIGINT  NOT NULL REFERENCES asesoria(id),
    es_jefe     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE granjero (
    id      BIGINT PRIMARY KEY REFERENCES usuario(id),
    num_leg VARCHAR(255)
);

CREATE TABLE explotacion (
    id            BIGSERIAL    PRIMARY KEY,
    nombre        VARCHAR(255) NOT NULL,
    ref_sig       VARCHAR(255),
    superficie_ha FLOAT,
    cultivo       VARCHAR(255),
    estado        VARCHAR(255),
    asesoria_id   BIGINT       NOT NULL REFERENCES asesoria(id),
    usuario_id    BIGINT       NOT NULL REFERENCES usuario(id),
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL
);

CREATE TABLE parcela (
    id              BIGSERIAL    PRIMARY KEY,
    ref_catastral   VARCHAR(255),
    superficie      FLOAT,
    cultivo         VARCHAR(255),
    municipio       VARCHAR(255),
    explotacion_id  BIGINT       NOT NULL REFERENCES explotacion(id),
    created_at      TIMESTAMP    NOT NULL,
    updated_at      TIMESTAMP    NOT NULL
);

CREATE TABLE producto_fitosanitario (
    id              BIGSERIAL    PRIMARY KEY,
    nombre          VARCHAR(255) NOT NULL,
    principio_act   VARCHAR(255),
    num_reg         VARCHAR(255),
    cultivos_autori TEXT,
    fecha_cadu      DATE,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL,
    updated_at      TIMESTAMP    NOT NULL
);

CREATE TABLE tratamiento (
    id                 BIGSERIAL          PRIMARY KEY,
    fecha              DATE               NOT NULL,
    texto_original     TEXT,
    ai_confidence      FLOAT,
    dosis              FLOAT              NOT NULL,
    unidades           VARCHAR(255)       NOT NULL,
    estado             VARCHAR(255),
    validado           BOOLEAN            NOT NULL DEFAULT FALSE,
    plaga_objetivo     VARCHAR(255),
    equipo_aplicacion  VARCHAR(255),
    superficie_tratada DOUBLE PRECISION   NOT NULL,
    parcela_id         BIGINT             NOT NULL REFERENCES parcela(id),
    usuario_id         BIGINT             NOT NULL REFERENCES usuario(id),
    producto_fito_id   BIGINT             NOT NULL REFERENCES producto_fitosanitario(id),
    created_at         TIMESTAMP          NOT NULL,
    updated_at         TIMESTAMP          NOT NULL
);

CREATE TABLE inventario (
    id               BIGSERIAL    PRIMARY KEY,
    alias_agric      VARCHAR(255),
    stock_act        FLOAT        NOT NULL,
    usuario_id       BIGINT       NOT NULL REFERENCES usuario(id),
    producto_fito_id BIGINT       NOT NULL REFERENCES producto_fitosanitario(id),
    created_at       TIMESTAMP    NOT NULL,
    updated_at       TIMESTAMP    NOT NULL
);
