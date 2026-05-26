# Explicación de cambios — Big Data CampoSync

Registro cronológico de todo lo que se va haciendo, por qué, y cómo revertirlo si hace falta.

---

## FASE 0 — Entorno Big Data

### 0.1 Docker: cambio de imagen PostgreSQL
**Fichero:** `docker-compose.yml`
**Cambio:** `postgres:15-alpine` → `pgvector/pgvector:pg15`

**Por qué:** La imagen original no incluye la extensión `vector` que necesita pgvector para almacenar embeddings. La nueva imagen es exactamente postgres:15 con la extensión preinstalada — mismo motor, mismo protocolo, mismos datos.

**Seguridad de datos:** El volumen `postgres_data` es independiente de la imagen Docker. Al cambiar la imagen los datos persisten intactos. La imagen original queda comentada en el fichero para revertir en 2 segundos si hace falta.

**Para revertir:** En `docker-compose.yml`, comentar la línea `pgvector/pgvector:pg15` y descomentar `postgres:15-alpine`.

---

### 0.2 Migration Flyway V14 — pgvector
**Fichero:** `src/main/resources/db/migration/V14__pgvector_embeddings.sql`

**Qué hace:**
1. `CREATE EXTENSION IF NOT EXISTS vector` — activa pgvector en la DB (requiere imagen `pgvector/pgvector:pg15`)
2. `ALTER TABLE producto_fitosanitario ADD COLUMN embedding vector(384)` — añade columna para los embeddings del catálogo RETO. 384 dimensiones = tamaño de salida del modelo `paraphrase-multilingual-MiniLM-L12-v2`
3. `CREATE INDEX ivfflat` — índice de búsqueda aproximada (ANN) con similitud coseno. `lists=100` es el valor recomendado para ~10k filas

**Por qué vector(384):** El modelo elegido genera vectores de 384 dimensiones. Si en el futuro se cambia de modelo, habría que recalcular todos los embeddings y ajustar la columna.

**Para revertir:** Borrar el fichero de migration y ejecutar manualmente `DROP EXTENSION vector CASCADE` — esto también borraría la columna embedding automáticamente.

---

### 0.3 Fix application.yaml — ddl-auto
**Fichero:** `src/main/resources/application.yaml`
**Cambio:** `ddl-auto: create` → `ddl-auto: validate`

**Por qué era un problema:** Con `create`, Hibernate borraba y recreaba todas las tablas en cada arranque de la app. Eso destruiría los 100k registros del seeder de Exp2 y los embeddings de Exp1 cada vez que se reiniciara Spring Boot.

**Por qué `validate` es correcto:** Flyway ya gestiona el schema completo. Hibernate solo debe verificar que las entidades coinciden con el schema existente, no gestionarlo. `validate` es el estándar para entornos con Flyway.

**Nota:** Si la app no arranca tras el cambio, es que hay una entidad con un campo que no existe en la DB o viceversa. El error de Hibernate indicará exactamente qué columna falta.

---

### 0.4 requirements.txt — dependencias Python
**Fichero:** `big-data/requirements.txt`

Agrupa todas las librerías necesarias para ambos experimentos:
- **sentence-transformers + torch** — generar embeddings (Exp1)
- **psycopg2-binary + pgvector + sqlalchemy** — conectar a PostgreSQL y usar columnas vector
- **rank-bm25 + scikit-learn** — baselines de recuperación TF-IDF y BM25 (Exp1)
- **pandas + numpy** — manipulación de datasets
- **matplotlib + seaborn** — gráficas de resultados
- **requests + httpx** — benchmark HTTP para Exp2 y scraper RETO
- **lxml** — parseo XML del registro RETO oficial
- **python-dotenv** — leer variables de entorno (.env) para la conexión a la DB

---

## FASE 1 — Ingesta RETO

### 1.0 Ficheros de soporte
**Ficheros creados:**
- `big-data/data/.gitkeep` — crea la carpeta `data/` en git (los CSV no se commitean, están en .gitignore)
- `.env.example` creado y borrado — el `.env` ya existe en la raíz de `camposync/` con las credenciales reales. `ingest_reto.py` apunta a `Path(__file__).parent.parent / ".env"` para leerlo desde `big-data/`.

---

### 1.1 reto_scraper.py
**Fichero:** `big-data/reto_scraper.py`

**Qué hace:** Descarga y parsea el XML del catálogo oficial RETO (Ministerio de Agricultura) y genera `data/reto_productos.csv` con los campos que necesitamos para los experimentos.

**Cómo usarlo:**
```bash
# Opción A: con fichero XML descargado manualmente desde el portal MAPA
python reto_scraper.py --file ruta/al/fichero.xml

# Opción B: descarga automática (puede fallar si MAPA cambia la URL)
python reto_scraper.py --download
```

**Decisiones de diseño:**
- El scraper detecta automáticamente el nombre del tag de producto (`PRODUCTO`, `Producto`, `item`...) porque el MAPA ha cambiado la estructura del XML entre versiones.
- Si no reconoce la estructura, imprime el árbol XML para facilitar el diagnóstico y ajuste manual.
- El ZIP se extrae en memoria (sin tocar disco) usando `BytesIO`.
- Los cultivos y plagas se agregan como strings separados por `;` — es lo que tiene la tabla `cultivos_autori` en la DB.

**Output CSV campos:** `num_reg`, `nombre`, `principio_act`, `titular`, `fecha_cadu`, `cultivos_autori`, `plagas`, `dosis_min`, `dosis_max`, `unidad_dosis`, `activo`

**Errores encontrados y resueltos:**
1. URL original (`fito_inventario.zip`) → 404. La URL correcta es un endpoint POST: `POST /regfiweb/Exportaciones/ExportJsonProductosAutorizados`
2. Los datos son JSON, no XML. Se reescribió el scraper completamente.
3. La respuesta HTTP viene doblemente codificada como string JSON dentro de JSON — se parsea en dos pasos.
4. Los campos reales del MAPA difieren de lo esperado: `Agente` (no `Plaga`), `Dosis_Min/Max` (no `DosisMinima`), `"Unidad Medida dosis"` con espacios en la clave.

**Resultado:** 2045 productos del catálogo RETO vigente descargados en `data/reto_productos.csv`.

---

### 1.2 ingest_reto.py
**Fichero:** `big-data/ingest_reto.py`

**Qué hace:** Lee `data/reto_productos.csv`, genera un embedding de 384 dimensiones por producto con `sentence-transformers` y hace UPSERT en `producto_fitosanitario` (columna `embedding`).

**Cómo usarlo:**
```bash
# Test: verificar conexión + procesar solo 5 productos
python ingest_reto.py --test

# Ingestión completa
python ingest_reto.py

# Con batch más grande si hay mucha RAM disponible
python ingest_reto.py --batch 64
```

**Texto que se vectoriza por producto:**
```
{nombre} | {principio_act} | {cultivos_autori[:200]} | {plagas[:200]}
```
Concatenar todo maximiza la similitud con consultas informales como "fungicida manzano contra pulgón" — el modelo encuentra el producto aunque el usuario no use el nombre exacto.

**Decisiones de diseño:**
- UPSERT por `num_reg` (número de registro MAPA) — si el producto ya existe lo actualiza, si no lo inserta. Idempotente.
- `num_reg` no tenía constraint UNIQUE en el schema original (`V1__init.sql`). El script lo añade dinámicamente con un bloque `DO $$` que es idempotente (comprueba si ya existe antes de crearlo).
- `normalize_embeddings=True` en el encode — los vectores quedan en la esfera unitaria, lo que mejora la similitud coseno.
- Procesa en batches (default 32) para no saturar la RAM con el modelo cargado.

**Errores encontrados y resueltos en ingest_reto.py:**
1. `StringDataRightTruncation` en `unidad_dosis_oficial VARCHAR(20)` — 2 valores superaban 20 chars. Solución: truncar con `[:20]`.
2. `StringDataRightTruncation` en `cultivos_autori VARCHAR(1000)` — listas largas de cultivos. Solución: truncar con `[:1000]`. Nota: la columna es `TEXT` en V1 pero fue recreada como `VARCHAR(1000)` por `ddl-auto: create` anterior al fix.
3. `load_dotenv(Path('.').parent / '.env')` no resolvía bien en scripts `-c`. La ruta correcta es absoluta o usar `Path(__file__).parent.parent` dentro de un fichero.

**Paso 1.3 — Verificación completada:**
- pgvector: ACTIVO en PostgreSQL 15.18
- 2045 productos ingestados con embeddings de 384 dims
- Query `"manzana pulgon"` → top-5 devuelve productos para manzano (Cydia) con similitud coseno ~0.53-0.56 ✅
- El ivfflat index avisa de "little data" con solo ~10k filas — es un warning informativo, no un error. En producción con más datos desaparece.

<!-- Aquí se irán añadiendo los siguientes pasos conforme se completen -->
