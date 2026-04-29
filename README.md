# CampoSync

**SaaS B2B multi-tenant para automatizar el Cuaderno Digital de Explotación (CUE)**, obligatorio en España desde septiembre de 2025 y conectado al sistema **SIEX** del MAPA.

---

## Tabla de contenidos

- [Visión del proyecto](#visión-del-proyecto)
- [Modelo de negocio](#modelo-de-negocio)
- [Arquitectura](#arquitectura)
- [Stack técnico](#stack-técnico)
- [Modelo de datos](#modelo-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Seguridad](#seguridad)
- [Estado del desarrollo](#estado-del-desarrollo)
- [Próximos pasos](#próximos-pasos)

---

## Visión del proyecto

A partir de septiembre de 2025, todas las explotaciones agrarias en España están obligadas a llevar un Cuaderno Digital de Explotación (CUE) y reportarlo al sistema SIEX del Ministerio de Agricultura, Pesca y Alimentación.

CampoSync digitaliza ese flujo end-to-end: el agricultor registra los tratamientos fitosanitarios desde el campo (incluso sin conexión), el asesor valida la información y la plataforma genera automáticamente el XML reglamentario para SIEX.

## Modelo de negocio

| Cliente | Tipo | Descripción |
|---------|------|-------------|
| **Asesoría agraria** | Tenant que paga | Contrata un Plan con un límite de explotaciones gestionables |
| **Asesor** | Usuario interno de la asesoría | Administra los granjeros y valida los tratamientos |
| **Granjero** | Usuario final | Registra tratamientos en campo (puede ser autónomo o vinculado a una asesoría) |

Cada asesoría es un *tenant* independiente. La facturación se gestiona via Stripe a nivel de asesoría.

## Arquitectura

```
┌──────────────────────────┐        ┌──────────────────────────┐
│  App del Granjero (PWA)  │        │  Panel del Asesor (SPA)  │
│  React · offline-first   │        │  React · dashboard       │
└────────────┬─────────────┘        └────────────┬─────────────┘
             │                                   │
             └────────────────┬──────────────────┘
                              │ HTTPS · JWT
                              ▼
                   ┌──────────────────────┐
                   │   Backend Spring     │
                   │   Boot 4.0.6 · Java 21│
                   └──────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌────────────┐  ┌────────────┐  ┌─────────────┐
       │ PostgreSQL │  │   Redis    │  │ Integraciones│
       │   15       │  │   7        │  │ SIEX · RETO  │
       │            │  │            │  │ SIGPAC·Stripe│
       └────────────┘  └────────────┘  └─────────────┘
```

## Stack técnico

### Backend

| Componente | Versión | Uso |
|------------|---------|-----|
| Java | 21 | Lenguaje base |
| Spring Boot | 4.0.6 | Framework principal |
| Spring Security | 6.x | Autenticación y autorización |
| Spring Data JPA | — | Persistencia |
| Hibernate | — | ORM |
| PostgreSQL | 15 | Base de datos principal |
| Redis | 7 | Caché y sesiones |
| Flyway | — | Migraciones de BD |
| MapStruct | 1.5.5 | Mapeo Entity ↔ DTO |
| Lombok | — | Reducción de boilerplate |
| JJWT | 0.12.5 | Generación y validación de JWT |
| Stripe Java | 25.1.0 | Pasarela de pagos |
| Quartz | — | Tareas programadas |
| Maven | 3.9 | Build tool |

### Frontends *(planificados)*

- **App del Granjero**: React PWA, offline-first con sincronización en background
- **Panel del Asesor**: React SPA, dashboard centralizado con exportador SIEX

## Modelo de datos

```
PLAN ──┐
       ▼
   ASESORIA ──┬──► ASESOR (extends USUARIO)
              ├──► INVITACION
              └──► EXPLOTACION ◄── GRANJERO (extends USUARIO)
                       │
                       ▼
                   PARCELA
                       │
                       ▼
                  TRATAMIENTO ──► PRODUCTO_FITOSANITARIO ◄── INVENTARIO ◄── GRANJERO
```

**Herencia JPA**: `USUARIO` es una entidad abstracta con estrategia `JOINED`. Las subclases `ASESOR` y `GRANJERO` tienen tabla propia unida por FK al `usuario` padre, con discriminador en la columna `discrimi`.

**Entidades implementadas (12)**:

| Entidad | Propósito |
|---------|-----------|
| `Plan` | Catálogo de planes de suscripción (precio, límites, ID Stripe) |
| `Asesoria` | Tenant principal — paga la suscripción |
| `Usuario` (abstract) | Base con `username`, `passwd`, timestamps |
| `Asesor` | Hereda de Usuario — vinculado a una asesoría |
| `Granjero` | Hereda de Usuario — propietario de explotaciones |
| `Invitacion` | Onboarding self-service por token |
| `Explotacion` | Unidad agraria con referencia SIGPAC |
| `Parcela` | Subdivisión catastral de una explotación |
| `ProductoFitosanitario` | Catálogo de productos autorizados (RETO) |
| `Tratamiento` | Aplicación registrada de un producto en una parcela |
| `Inventario` | Stock de productos por granjero |

## Estructura del proyecto

```
camposync/
├── docker-compose.yml          # PostgreSQL + Redis
├── pom.xml
├── src/
│   └── main/
│       ├── java/com/camposync/
│       │   ├── CamposyncApplication.java
│       │   ├── controller/     # REST endpoints
│       │   │   └── AuthController.java
│       │   ├── dto/            # Records de entrada/salida
│       │   ├── entity/         # 12 entidades JPA
│       │   ├── repository/     # 11 repositorios Spring Data
│       │   └── security/       # JWT + Spring Security
│       │       ├── JwtAuthenticationFilter.java
│       │       ├── JwtService.java
│       │       ├── SecurityConfig.java
│       │       ├── UserDetailsServiceImpl.java
│       │       └── UsuarioPrincipal.java
│       └── resources/
│           ├── application.yaml
│           └── db/migration/
│               └── V1__init.sql
```

## Puesta en marcha

### Prerrequisitos

- Java 21
- Docker + Docker Compose
- Maven 3.9+ (o el wrapper incluido `./mvnw`)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url> camposync && cd camposync

# 2. Crear el archivo .env con las variables (ver sección siguiente)
cp .env.example .env

# 3. Levantar PostgreSQL y Redis
docker compose up -d

# 4. Compilar el proyecto
./mvnw clean compile

# 5. Arrancar el backend (Flyway crea las tablas en el primer arranque)
./mvnw spring-boot:run
```

La API queda disponible en `http://localhost:8080`.

### Verificar que la BD está creada

```bash
docker exec camposync-postgres psql -U admin_saas -d agro_data -c "\dt"
```

Debe listar 12 tablas + `flyway_schema_history`.

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```dotenv
# PostgreSQL
DB_USER=admin_saas
DB_PASSWORD=<contraseña-segura>
DB_NAME=agro_data

# Redis
REDIS_PASSWORD=<contraseña-segura>

# JWT
JWT_SECRET=<clave-larga-de-al-menos-32-caracteres>

# Stripe (modo test)
STRIPE_SECRET_KEY=sk_test_xxx

# AWS S3 (futuro almacenamiento de adjuntos)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=...
```

> **Importante**: el archivo `.env` no debe versionarse. Está en `.gitignore`.

## Seguridad

### Autenticación

- **JWT stateless** firmado con HMAC-SHA256
- Token con TTL de 24 horas
- Header esperado: `Authorization: Bearer <token>`

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "asesor@ejemplo.com",
  "password": "***"
}
```

**Respuesta**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Rutas

| Patrón | Acceso |
|--------|--------|
| `/api/auth/**` | Público |
| Resto | Requiere JWT válido |

### Roles

Los `GrantedAuthority` se generan en función de la subclase concreta del usuario:

- `Asesor` → `ROLE_ASESOR`
- `Granjero` → `ROLE_GRANJERO`

### Hashing de contraseñas

`BCryptPasswordEncoder` con factor de coste por defecto.

## Estado del desarrollo

### Implementado

- [x] Configuración de Maven, Docker y Flyway
- [x] Modelo de datos completo (12 entidades + migración SQL)
- [x] Capa de repositorios Spring Data (11 interfaces)
- [x] Seguridad JWT (filtro, servicio, configuración)
- [x] Endpoint `POST /api/auth/login`

### Pendiente (orden previsto)

- [ ] Capa de servicios (lógica de negocio)
- [ ] Endpoint de registro y onboarding por invitación
- [ ] Filtro multi-tenant por asesoría
- [ ] CRUD de explotaciones, parcelas y tratamientos
- [ ] Validador RETO (productos autorizados por cultivo)
- [ ] Exportador SIEX (XML reglamentario)
- [ ] Integración SIGPAC (validación geográfica)
- [ ] Pasarela Stripe (suscripciones)
- [ ] Frontend PWA (granjero) y SPA (asesor)

## Próximos pasos

El siguiente bloque de trabajo es la **capa de servicios**, donde se implementará la lógica de negocio sobre las entidades y repositorios existentes:

1. `AsesoriaService` — alta de asesoría, asignación de plan, gestión del ciclo de vida
2. `UsuarioService` — registro, validación de credenciales, BCrypt encoding
3. `InvitacionService` — flujo de onboarding self-service por token
4. `ExplotacionService` — alta de explotación con validación contra el límite del Plan
5. `TratamientoService` — registro y validación de tratamientos

---

## Licencia

Propietario — todos los derechos reservados.
