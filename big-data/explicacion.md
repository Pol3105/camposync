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

<!-- Aquí se irán añadiendo los siguientes pasos conforme se completen -->
