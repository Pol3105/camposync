# CampoSync

**SaaS B2B multi-tenant para automatizar el Cuaderno Digital de Explotación (CUE)**, obligatorio en España desde septiembre de 2025 y conectado al sistema **SIEX** del MAPA.

---

## Tabla de contenidos

- [Visión del proyecto](#visión-del-proyecto)
- [Modelo de negocio](#modelo-de-negocio)
- [Arquitectura](#arquitectura)
- [Stack técnico](#stack-técnico)
- [Modelo de datos](#modelo-de-datos)
- [App del Agricultor — Funcionalidades](#app-del-agricultor--funcionalidades)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Seguridad](#seguridad)
- [Estado del desarrollo](#estado-del-desarrollo)
- [Bitácora de desafíos técnicos](#bitácora-de-desafíos-técnicos)
- [Próximos pasos](#próximos-pasos)

---

## Visión del proyecto

A partir de septiembre de 2025, todas las explotaciones agrarias en España están obligadas a llevar un Cuaderno Digital de Explotación (CUE) y reportarlo al sistema SIEX del Ministerio de Agricultura, Pesca y Alimentación.

CampoSync digitaliza ese flujo end-to-end: el agricultor registra los tratamientos fitosanitarios desde el campo (incluso sin conexión), el asesor valida la información y la plataforma generará automáticamente el XML reglamentario para SIEX.

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
│  App del Agricultor      │        │  Panel del Asesor (SPA)  │
│  React · mobile-first    │        │  React · funcional       │
│  (implementado)          │        │  (implementado)          │
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
| Flyway | — | Migraciones de BD (V1–V12) |
| MapStruct | 1.5.5 | Mapeo Entity ↔ DTO |
| Lombok | — | Reducción de boilerplate |
| JJWT | 0.12.5 | Generación y validación de JWT |
| Stripe Java | 25.1.0 | Pasarela de pagos |
| Quartz | — | Tareas programadas |
| Maven | 3.9 | Build tool |

### Frontend

- **Panel del Asesor**: React SPA, funcional — navegación jerárquica Explotación → Parcela → Recinto → Tratamiento, modales SIEX/SIGPAC con datos reales de BD
- **App del Agricultor**: React SPA mobile-first (max-width 480px), funcional — cuaderno de campo, gestión de inventario de fitosanitarios, navegación Explotación → Parcela → Recinto → Tratamientos con modal pre-rellenado

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
                   RECINTO          ← unidad mínima SIGPAC
                       │
                       ▼
                  TRATAMIENTO ──► PRODUCTO_FITOSANITARIO ◄── INVENTARIO ◄── GRANJERO
                                                                              │
                                                              ┌───────────────┴───────────────┐
                                                              ▼                               ▼
                                                          APLICADOR                     EQUIPAMIENTO
```

**Herencia JPA**: `USUARIO` es una entidad abstracta con estrategia `JOINED`. Las subclases `ASESOR` y `GRANJERO` tienen tabla propia unida por FK al `usuario` padre, con discriminador en la columna `discrimi`.

**Entidades implementadas (14)**:

| Entidad | Propósito |
|---------|-----------|
| `Plan` | Catálogo de planes de suscripción (precio, límites, ID Stripe) |
| `Asesoria` | Tenant principal — paga la suscripción |
| `Usuario` (abstract) | Base con `username`, `passwd`, timestamps |
| `Asesor` | Hereda de Usuario — vinculado a una asesoría |
| `Granjero` | Hereda de Usuario — propietario de explotaciones |
| `Invitacion` | Onboarding self-service por token |
| `Explotacion` | Unidad agraria con campos SIEX completos (REA, orientación, provincia/municipio INE, año declaración) |
| `Parcela` | Subdivisión catastral — incluye datos SIGPAC (polígono, parcela, agregado, zona, provincia) |
| `Recinto` | Unidad mínima de declaración SIGPAC (uso, sistema de cultivo, cultivo, superficie) |
| `ProductoFitosanitario` | Catálogo de productos con dosis oficiales MAPA (dosisMin, dosisMax, unidadDosisOficial) |
| `Tratamiento` | Aplicación registrada de un producto en un recinto — campos SIEX completos (motivo, plaga EPPO, ITEAF, ROPO, aplicador) |
| `Inventario` | Stock de productos por granjero |
| `Aplicador` | Persona autorizada para aplicar fitosanitarios (ROPO, NIF, nivel capacitación) |
| `Equipamiento` | Maquinaria de tratamiento del granjero (alias, tipo, Nº registro ITEAF) |

### Campos SIEX implementados

| Entidad | Campos SIEX |
|---------|-------------|
| `Explotacion` | `codigoRea`, `tipoExplotacion` (PF/SC/SA/SL), `orientacionProductiva` (CE/VI/OL/FS/HO/PA), `provinciaExplotacion`, `municipioExplotacion`, `anioDeclaracion` |
| `Tratamiento` | `motivoTratamiento` (PR/CU/ED), `codigoPlaga` (EPPO), `tipoEquipo`, `numRegistroIteaf`, `fechaIteaf`, `volumenCaldo`, `nifAplicador`, `numeroRopo`, `nivelCapacitacionRopo` |
| `ProductoFitosanitario` | `dosisMin`, `dosisMax`, `unidadDosisOficial` |

## App del Agricultor — Funcionalidades

La interfaz del agricultor es una SPA React mobile-first (contenedor máximo 480 px) con navegación por barra inferior fija. Agrupa cinco secciones: Inicio, Cuaderno, Fincas, Inventario y Perfil.

### Gestión de Inventario Inteligente

#### Vista principal — Mi Inventario

Cada producto aparece en una tarjeta con:

- **Borde de color** dinámico: rojo (sin stock), ámbar (stock bajo, < 5 unidades), verde (disponible).
- **Badge de stock** con valor numérico y unidad deducida automáticamente.
- **Barra de estado** con icono y mensaje contextual por tarjeta.
- **KPIs en cabecera**: total de productos, productos con stock bajo y productos sin stock.

#### Integración con el catálogo oficial MAPA

Al añadir un producto el agricultor no escribe su nombre: selecciona desde el catálogo oficial de productos fitosanitarios registrados (`ProductoFitosanitario`) cargado desde el backend. El modal muestra el Nº de registro y la dosis oficial como chips informativos.

#### Lógica de Upsert en backend

`InventarioService.crear()` implementa un upsert atómico:

```
findByGranjero_IdAndProductoFitosanitario_Id → existe → suma stock
                                             → no existe → crea registro
```

Esto evita duplicados sin lógica adicional en el cliente.

#### Gestión de unidades sin redundancia

La tabla `inventario` no almacena la unidad de medida. El servicio backend deduce la unidad en tiempo de consulta mediante `deriveUnidad(String unidadDosisOficial)`:

| Patrón en dosis oficial | Unidad deducida |
|-------------------------|-----------------|
| contiene `kg` o `g/`    | `Kg`            |
| contiene `ml`           | `ml`            |
| contiene `l/`, `l ` o termina en `l` | `L` |
| resto                   | `uds.`          |

La misma lógica se replica en el frontend (`deriveUnidad` en `ModalNuevoInventario.jsx`) para mostrar la unidad correcta en el label del input antes de enviar el formulario.

#### UX Avanzada — Suma rápida de stock

Cada tarjeta del inventario incluye un botón `+` circular que abre el modal en modo **"Sumar stock"**:

- El producto aparece bloqueado (no hay selector, no se puede cambiar).
- El alias y la unidad se pre-cargan desde el item seleccionado.
- El título cambia a **"Sumar stock"** y el botón de envío a **"Sumar unidades"**.
- El label del campo numérico pasa de *"Stock inicial"* a *"Cantidad a añadir"*.
- Al confirmar, el upsert del backend suma automáticamente al stock existente.

El FAB flotante de la vista abre el mismo modal en modo creación estándar (catálogo completo disponible).

---

## Estructura del proyecto

```
camposync/
├── docker-compose.yml
├── pom.xml
├── src/
│   └── main/
│       ├── java/com/camposync/
│       │   ├── CamposyncApplication.java
│       │   ├── config/
│       │   │   ├── DataInitializer.java     # Seed base (asesor + granjero demo)
│       │   │   └── DataSeeder.java          # Seed realista (10 granjeros, 25 explot., 20 tratamientos)
│       │   ├── controller/
│       │   │   ├── AsesorPanelController.java   # /api/asesor/** (panel centralizado)
│       │   │   ├── AuthController.java
│       │   │   ├── ExplotacionController.java
│       │   │   ├── InventarioController.java
│       │   │   ├── InvitacionController.java
│       │   │   ├── ParcelaController.java
│       │   │   ├── RecintoController.java
│       │   │   └── TratamientoController.java
│       │   ├── dto/                         # 19 Records de entrada/salida
│       │   ├── entity/                      # 12 entidades JPA
│       │   ├── repository/                  # 12 repositorios Spring Data
│       │   ├── service/
│       │   │   ├── AsesorPanelService.java
│       │   │   ├── AuthService.java
│       │   │   ├── ExplotacionService.java
│       │   │   ├── InventarioService.java
│       │   │   ├── InvitacionService.java
│       │   │   ├── ParcelaService.java
│       │   │   ├── RecintoService.java
│       │   │   └── TratamientoService.java
│       │   └── security/
│       │       ├── JwtAuthenticationFilter.java
│       │       ├── JwtService.java
│       │       ├── SecurityConfig.java
│       │       ├── UserDetailsServiceImpl.java
│       │       └── UsuarioPrincipal.java
│       └── resources/
│           ├── application.yaml
│           └── db/migration/
│               ├── V1__init.sql                  # Esquema base
│               ├── V2__granjero_asesoria.sql      # Relación granjero-asesoría
│               ├── V3__tratamiento_observaciones_validador.sql
│               ├── V4__siex_fields.sql            # Campos SIEX iniciales
│               ├── V5__recinto.sql                # Entidad Recinto + migración datos
│               └── V6__siex_compliance.sql        # Campos SIEX completos + VARCHAR calibrados
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx                          # Enrutador principal (React Router)
        ├── components/
        │   └── AppLayout.jsx
        ├── services/
        │   └── api.js                       # Cliente HTTP centralizado
        └── pages/
            ├── LoginPage.jsx
            ├── SignUpPage.jsx
            ├── InviteRegisterPage.jsx
            ├── InvitacionesPage.jsx
            ├── DashboardPage.jsx            # Panel del asesor
            ├── DashboardGranjero.jsx        # Cuaderno del granjero
            ├── AgricultoresPage.jsx         # Listado de agricultores
            ├── AgricultorExplotacionesPage.jsx  # Explotaciones + modal Ficha SIEX
            ├── ExplotacionesPage.jsx
            ├── ExplotacionParcelasPage.jsx  # Parcelas + modal SIGPAC + botón Exportar SIEX
            ├── ParcelaRecintosPage.jsx      # Recintos SIGPAC + modal detalle
            ├── ParcelaTratamientosPage.jsx
            ├── RecintoTratamientosPage.jsx  # Historial tratamientos por recinto + KPIs
            └── TratamientosPage.jsx
```

## Puesta en marcha

### Prerrequisitos

- Java 21
- Docker + Docker Compose
- Maven 3.9+ (o el wrapper incluido `./mvnw`)
- Node.js 18+ (para el frontend)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url> camposync && cd camposync

# 2. Crear el archivo .env con las variables (ver sección siguiente)
cp .env.example .env

# 3. Levantar PostgreSQL y Redis
docker compose up -d

# 4. Arrancar el backend (Flyway ejecuta V1–V6 y los seeders en el primer arranque)
./mvnw spring-boot:run

# 5. (Opcional) Arrancar el frontend del asesor
cd frontend && npm install && npm run dev
```

La API queda disponible en `http://localhost:8080`.  
El frontend de desarrollo en `http://localhost:5173`.

### Verificar que la BD está creada

```bash
docker exec camposync-postgres psql -U admin_saas -d agro_data -c "\dt"
```

Debe listar 14 tablas + `flyway_schema_history`.

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
| `/api/auth/login` | Público |
| `/api/auth/register` | Público |
| `/api/auth/register-invite/**` | Público |
| `/api/invitaciones/*/aceptar` | Público |
| Resto | Requiere JWT válido |

### Roles

Los `GrantedAuthority` se generan en función de la subclase concreta del usuario:

- `Asesor` → `ROLE_ASESOR`
- `Granjero` → `ROLE_GRANJERO`

### Hashing de contraseñas

`BCryptPasswordEncoder` con factor de coste por defecto.

## Estado del desarrollo

### Implementado

- [x] Configuración de Maven, Docker y Flyway (V1–V12)
- [x] Modelo de datos completo — 14 entidades + esquema jerárquico Explotacion → Parcela → Recinto → Tratamiento
- [x] Campos SIEX/SIGPAC en Explotacion, Recinto, Tratamiento y ProductoFitosanitario
- [x] Capa de repositorios Spring Data (12 interfaces)
- [x] Seguridad JWT (filtro, servicio, configuración)
- [x] Endpoints de autenticación (`POST /api/auth/login`, registro, onboarding por invitación)
- [x] **Capa de servicios** — lógica de negocio básica (8 servicios)
- [x] **CRUD de explotaciones, parcelas y recintos** — endpoints REST securizados
- [x] Panel del asesor — endpoints `/api/asesor/**` con verificación de pertenencia a asesoría
- [x] Nuevos endpoints: `GET /asesor/parcelas/{id}/recintos` y `GET /asesor/recintos/{id}/tratamientos`
- [x] **Frontend SPA del asesor** — refactorizado y funcional
  - Navegación jerárquica: Agricultores → Explotaciones → Parcelas → Recintos → Tratamientos
  - Ficha SIEX dinámica por explotación (datos reales de BD)
  - Modal de detalles SIGPAC por parcela y por recinto (datos reales de BD)
  - KPIs de tratamientos (total, validados, pendientes) por recinto
  - Breadcrumb completo en todas las vistas de detalle
  - Botón "Exportar SIEX (XML)" integrado en la UI — **lógica de generación pendiente**
- [x] Seed de datos realistas: 10 granjeros, 25 explotaciones, 50 parcelas/recintos, 20 tratamientos con campos SIEX completos
- [x] **App del Agricultor mobile-first** — SPA React funcional
  - Dashboard con KPIs y acceso directo al cuaderno
  - Navegación jerárquica: Fincas → Explotación → Parcela → Recinto → Tratamientos del recinto
  - Modal de nuevo tratamiento con campos SIEX opcionales (motivo, equipo, volumen caldo) y preselección de contexto
  - **Gestión de Inventario** completa: vista de tarjetas, catálogo MAPA, upsert de stock, deducción automática de unidades, suma rápida por tarjeta
  - Entidades `Aplicador` y `Equipamiento` (persistencia lista, API pendiente)
  - Validación de NIF en pantalla de perfil

### Pendiente (orden previsto)

- [ ] **Exportador SIEX (XML reglamentario)** — botón ya presente en UI, lógica de generación no implementada
- [ ] API y UI de Maquinaria y Aplicadores (persistencia ya implementada en V12)
- [ ] Validador RETO (productos autorizados por cultivo)
- [ ] Integración SIGPAC (validación geográfica de recintos)
- [ ] Filtro multi-tenant estricto por asesoría en todos los endpoints
- [ ] Pasarela Stripe (suscripciones y facturación)
- [ ] Panel de administración (gestión de asesorías y planes)

---

## Bitácora de desafíos técnicos

Esta sección documenta los problemas no triviales resueltos durante el desarrollo, para preservar el contexto de decisiones arquitectónicas que no son evidentes en el código.

### 1. Migración de `ddl-auto` a Flyway (V1–V6)

**Problema**: En la fase inicial, el esquema se gestionaba con `spring.jpa.hibernate.ddl-auto: update`. Esta estrategia resulta aceptable para prototipar, pero en cuanto el modelo evolucionó (adición de `Recinto`, refactorización de campos SIEX, renombrado de columnas), Hibernate dejó de ser capaz de aplicar los cambios de forma segura: no ejecuta `DROP COLUMN`, no renombra columnas y no garantiza el orden de las migraciones.

**Solución**: Transición completa a Flyway con `ddl-auto: validate`. Se estableció la convención de versiones:

| Migración | Contenido |
|-----------|-----------|
| `V1__init.sql` | Esquema base completo |
| `V2__granjero_asesoria.sql` | Relación granjero-asesoría |
| `V3__tratamiento_observaciones_validador.sql` | Campos de validación |
| `V4__siex_fields.sql` | Primeros campos SIEX |
| `V5__recinto.sql` | Introducción de la entidad `Recinto` con migración de datos (`parcela_id → recinto_id` en tratamientos) |
| `V6__siex_compliance.sql` | Campos SIEX completos, renombrado `superficie_ha → superficie_total`, calibración de VARCHAR |
| `V7__invitacion_rol_destino.sql` | Campo `rol_destino` en invitaciones |
| `V8__password_reset_token.sql` | Tabla de tokens de reset de contraseña |
| `V9__inventario_unidad_medida.sql` | Añade `unidad_medida` a inventario (revertido en V11) |
| `V10__fix_unidades_nulas_inventario.sql` | Rellena nulos de `unidad_medida` con valor por defecto |
| `V11__drop_unidad_medida_inventario.sql` | Elimina `unidad_medida` — la unidad se deduce de `ProductoFitosanitario` |
| `V12__create_aplicador_equipamiento.sql` | Tablas `aplicador` y `equipamiento` (maquinaria y personal ROPO del granjero) |

El paso más crítico fue V5: la migración debía ser idempotente (uso de `IF NOT EXISTS` y bloques `DO $$`) para no romper entornos ya inicializados.

---

### 2. El "Filtro Fantasma" — doble registro del filtro JWT

**Problema**: En Spring Boot, cualquier `@Component` que implemente `Filter` (o herede de `OncePerRequestFilter`) se registra **automáticamente** como servlet filter por `FilterRegistrationAutoConfiguration`, además de cualquier registro explícito dentro del `SecurityFilterChain` vía `addFilterBefore`. El resultado es que `JwtAuthenticationFilter` se ejecutaba dos veces por petición: una vez fuera del contexto de Security (sin acceso al `SecurityContextHolder`) y otra dentro. La segunda ejecución producía comportamientos erráticos en rutas públicas con wildcards y rompía la propagación del contexto de autenticación.

**Solución**: Deshabilitar el auto-registro del filtro declarando un `FilterRegistrationBean` con `setEnabled(false)` en `SecurityConfig`:

```java
@Bean
public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(
        JwtAuthenticationFilter filter) {
    FilterRegistrationBean<JwtAuthenticationFilter> bean = new FilterRegistrationBean<>(filter);
    bean.setEnabled(false);  // Solo debe ejecutarse dentro del SecurityFilterChain
    return bean;
}
```

Esto garantiza que el filtro únicamente se ejecute en el contexto correcto, gestionado por Spring Security.

---

### 3. Robustez en la comunicación frontend-API (crash en login)

**Problema**: Tras un login exitoso, el cliente React crasheaba con `TypeError: Cannot read properties of undefined` en el proceso de almacenar el token. La causa raíz era que el cliente HTTP esperaba la respuesta en un formato (`data.token`) que no coincidía con la estructura real devuelta por el backend en ciertos casos de error HTTP que llegaban con status 200 (respuestas de error de Spring Security no configuradas correctamente).

**Solución**: El cliente HTTP centralizado (`api.js`) se reforzó para:
1. Verificar explícitamente `response.ok` antes de parsear el JSON.
2. Lanzar un error con el cuerpo de la respuesta cuando el status no es 2xx.
3. Validar la existencia de `token` en la respuesta antes de persistirlo en `localStorage`.

Este patrón defensivo se aplicó a todas las llamadas del cliente, eliminando la clase completa de crashes por respuestas inesperadas.

---

### 4. Calibración de longitudes VARCHAR para cumplimiento SIEX

**Problema**: El estándar SIEX define longitudes máximas estrictas para sus campos codificados. Al poblar la base de datos con el seeder, varias inserciones fallaban con `value too long for type character varying(N)` porque los campos de entidad Java tenían o bien `@Column` sin `length` (que Hibernate mapea a VARCHAR(255) por defecto) o bien longitudes incorrectas.

**Campos afectados y longitudes finales** (migración V6):

| Columna | Tabla | VARCHAR |
|---------|-------|---------|
| `tipo_explotacion` | `explotacion` | 2 |
| `orientacion_productiva` | `explotacion` | 4 |
| `provincia_explotacion` | `explotacion` | 2 |
| `municipio_explotacion` | `explotacion` | 5 |
| `motivo_tratamiento` | `tratamiento` | 2 |
| `nivel_capacitacion_ropo` | `tratamiento` | 2 |
| `nif_aplicador` | `tratamiento` | 15 |
| `unidad_dosis_oficial` | `producto_fitosanitario` | 20 |

**Solución**: Aplicación de los tipos correctos en V6 vía `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` con la precisión exacta requerida por la normativa. En el seeder, se adoptaron los códigos de 2 caracteres normalizados (p. ej. `CE`, `VI`, `OL` para `orientacionProductiva`) en lugar de los códigos CNAE de 4 caracteres que se usaban por error en la iteración anterior.

---

## Próximos pasos

El bloque prioritario es el **exportador SIEX (XML reglamentario)**. El botón ya está integrado en `ExplotacionParcelasPage` y el modelo de datos contiene todos los campos necesarios. La implementación requiere:

1. `SiexXmlService` — serialización del árbol Explotacion → Parcela → Recinto → Tratamiento al esquema XSD oficial del MAPA
2. Endpoint `GET /asesor/explotaciones/{id}/siex-xml` que devuelva el fichero como `application/xml`
3. Conexión del botón frontend al endpoint real

Adicionalmente:

4. `RetoValidatorService` — cruce de productos aplicados contra el registro de productos autorizados por cultivo
5. Integración SIGPAC para validación geográfica de recintos declarados

---

## Licencia

Propietario — todos los derechos reservados.
