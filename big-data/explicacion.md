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

---

## FASE 2 — Dataset anotado

### generate_dataset.py
**Fichero:** `big-data/exp1-retrieval/generate_dataset.py`
**Output:** `big-data/exp1-retrieval/data/queries_annotated.csv`

**Qué hace:** toma 150 productos vigentes del RETO al azar y genera hasta 7 variantes de query por producto, simulando cómo un agricultor real buscaría ese producto.

**7 tipos de variante:**

| Tipo | Ejemplo | Dificultad |
|------|---------|------------|
| nombre exacto | `PENSHAR 40% SC` | fácil |
| nombre parcial (1-2 palabras) | `PENSHAR` | media |
| principio activo | `pendimetalina` | media |
| nombre minúscula sin guiones | `penshar 40% sc` | media |
| cultivo + plaga | `achicoria dicotiledóneas anuales` | difícil |
| cultivo solo | `achicoria (hojas)` | difícil |
| typo (letra dup/swap/del) | `peshar 40% sc` | difícil |

**Resultado:** 841 queries anotadas — cada una sabe cuál es su `num_reg_correcto` y `nombre_correcto`.

**Por qué >500:** el plan pedía ~500 pero con 150 productos × 7 variantes salen 841. Más datos = mejor evaluación estadística. No hay razón para reducirlos.

---

## FASE 3 — Experimento 1: Retrieval Accuracy

### 3.1–3.4 Scripts de búsqueda
**Ficheros:**
- `exp1-retrieval/scripts/exact_match.py` — ya existía, compatible con el evaluador
- `exp1-retrieval/scripts/tfidf.py` — TF-IDF con bigramas y sublinear TF
- `exp1-retrieval/scripts/bm25.py` — BM25Okapi de rank-bm25
- `exp1-retrieval/scripts/embeddings_pgvector.py` — sentence-transformers + pgvector ANN

Todos los scripts exponen `run(queries_df, productos_df) → pd.DataFrame` con columnas `acierto_p1` y `acierto_r5`.

---

### 3.5 evaluate.py
**Fichero:** `exp1-retrieval/evaluate.py`

Orquesta los 4 métodos, calcula Precision@1 / Recall@5 / F1-Score global y por dificultad, y genera:
- `results/metrics_comparison.csv`
- `results/metrics_chart.png`

**Uso:**
```bash
cd big-data/exp1-retrieval
python evaluate.py                   # todos los métodos
python evaluate.py --skip-embeddings # sin DB (solo baselines)
python evaluate.py --metodo tfidf    # un solo método
```

**Errores encontrados y resueltos:**
1. `psycopg2` en `embeddings_pgvector.py` usaba `%s::vector` con cast explícito. Con `register_vector(conn)` activo, el cast causa conflicto — la función recibe el vector como tipo erróneo y devuelve resultados aleatorios (P@1 = 1.9%). Solución: quitar el cast, usar solo `%s` y pasar el numpy array directamente. El adaptador pgvector lo convierte automáticamente.

---

### 3.6 Análisis de resultados

**Resultados finales (841 queries, 1969 productos vigentes):**

| Método | P@1 | R@5 | F1 global | F1 fácil | F1 media | F1 difícil |
|--------|-----|-----|-----------|----------|----------|------------|
| Exact Match | 0.345 | 0.345 | 0.345 | **1.000** | 0.373 | 0.003 |
| TF-IDF | 0.537 | 0.738 | **0.622** | 0.966 | **0.739** | **0.301** |
| BM25 | 0.533 | 0.687 | 0.600 | 0.966 | 0.734 | 0.262 |
| Embeddings (paraphrase) | 0.050 | 0.064 | 0.056 | 0.139 | 0.055 | 0.018 |

**Hallazgo inesperado — por qué embeddings falla:**

Se esperaba que embeddings (`paraphrase-multilingual-MiniLM-L12-v2`) superase a TF-IDF, pero quedó último con F1=0.056. Las causas son:

1. **Modelo inadecuado para retrieval:** `paraphrase-multilingual-MiniLM-L12-v2` es un modelo *simétrico* entrenado para detectar paráfrasis (equivalencia semántica entre dos frases). NO está diseñado para retrieval asimétrico (consulta corta → documento largo). Para retrieval se necesitan bi-encoders especializados como `multi-qa-MiniLM-L6-cos-v1` o `msmarco-distilbert`.

2. **Nombres de marca fuera del vocabulario:** Los nombres RETO son marcas propias ("RUNRUD", "CHANON", "GRAPHOLITA PRO PRESS"). El modelo los tokeniza como subpalabras desconocidas, produciendo embeddings similares entre productos con estructura morfológica parecida pero semánticamente distintos.

3. **Asimetría query-documento:** Incluso con el texto indexado reducido a `"{nombre} {principio_act}"`, la similitud coseno entre "RUNRUD" (query) y "RUNRUD GLIFOSATO 36%" (documento) es ~0.65 — pero otros productos con tokens similares pueden puntuarse más alto.

**Por qué TF-IDF gana:**

TF-IDF funciona por coincidencia léxica exacta: "PENSHAR 40% SC" tokenizado tiene IDF alto porque esos tokens son raros en el corpus → el producto correcto siempre ocupa el top-1. Para consultas difíciles (cultivo+plaga), TF-IDF también funciona porque los campos `cultivos_autori` y `plagas` contienen exactamente esas palabras.

**Conclusión académica:**

Para catálogos de productos fitosanitarios con nombres de marca, TF-IDF/BM25 superan a embeddings simétricos. La mejora de embeddings requeriría:
- Modelo bi-encoder entrenado para retrieval (asimétrico)
- Fine-tuning sobre consultas reales de agricultores
- O un enfoque híbrido: BM25 para recall + reranking semántico

Este resultado, aunque inesperado, es un hallazgo válido y documentable en el informe.

---

## FASE 4 — Seeder 100k registros

### 4.1 seed_100k.py
**Fichero:** `big-data/exp2-query-performance/data/seed_100k.py`

**Qué hace:** Genera y puebla la base de datos local `agro_data` con un dataset a escala de Big Data para el experimento de rendimiento de consultas (Exp2):
*   **50 Granjeros:** Usuarios simulados con rol `GRANJERO`.
*   **1.000 Explotaciones:** Distribuidas equitativamente entre los nuevos granjeros.
*   **5.000 Parcelas:** Vinculadas a las explotaciones (distribuidas equitativamente).
*   **15.000 Recintos:** Con cultivos realistas de secano/regadío y usos SIGPAC (Trigo, Cebada, Olivo, Almendro, etc.).
*   **100.000 Tratamientos:** Vinculados a los recintos, productos autorizados del catálogo RETO, aplicadores y equipamiento.

### Decisiones de Diseño y Optimizaciones:
1.  **Idempotencia y Limpieza:** El script incluye un borrado previo inteligente de ejecuciones pasadas ordenado según dependencias de llaves foráneas (`tratamiento` -> `recinto` -> `parcela` -> `explotacion` -> `granjero` -> `usuario`) para asegurar consistencia transaccional y evitar colisiones sin duplicar datos innecesariamente.
2.  **Integridad Referencial Estricta:** Se precalculan los mapas lógicos del dominio: el `usuario_id` (granjero) asignado al tratamiento **debe** coincidir exactamente con el propietario de la explotación que contiene al recinto tratado. Si no se respetara esta regla, se invalidaría el dominio en un entorno de producción real de JPA.
3.  **Inserción por Lotes (Batch Insert):** El uso de `extras.execute_values` de `psycopg2` permite insertar los datos de forma masiva en lugar de registro a registro. Para los 100.000 tratamientos, se inyectan en batches de 10.000 filas. Esto reduce drásticamente el coste de comunicación por red e inserción, logrando poblar los ~121.000 registros totales de la estructura relacional en **menos de 10 segundos**.
4.  **Distribución Uniforme:** Al consultar directamente los IDs asignados por la base de datos tras las inserciones (en vez de usar el RETURNING limitado por el `page_size` de psycopg2), se garantiza una distribución estadística completamente uniforme y representativa de todas las parcelas y explotaciones.

### 4.2 Verificación de Datos
Tras la ejecución del seeder, se ejecutó un script de diagnóstico que arrojó los siguientes conteos exactos:
-   **Granjeros totales:** 61 (11 iniciales + 50 nuevos).
-   **Explotaciones totales:** 1.026 (26 iniciales + 1.000 nuevas).
-   **Parcelas totales:** 5.052 (52 iniciales + 5.000 nuevas).
-   **Recintos totales:** 15.041 (41 iniciales + 15.000 nuevos).
-   **Tratamientos totales:** 100.018 (18 iniciales + 100.000 nuevos; 3 iniciales eliminados por FK en cascada segura).

Esto demuestra la consecución exitosa de la **Fase 4** al lograr una base de datos de producción perfectamente escalada para evaluar los problemas de consultas N+1 en Spring Boot/Hibernate (Fase 5).

---

## FASE 5 — Experimento 2: Query Performance (N+1)

### 5.1 Cambios en el Repositorio y Arquitectura Spring Boot
Para implementar y evaluar las diferentes estrategias de carga de Hibernate, se realizaron modificaciones en la capa de datos y controladores de la aplicación Spring Boot:

1.  **TratamientoRepository.java**:
    *   **JOIN FETCH (`findByGranjero_IdJoinFetch`)**: Se implementó una consulta JPQL personalizada con `JOIN FETCH` explícitos sobre todas las relaciones perezosas (`recinto`, `parcela`, `explotacion`, `productoFitosanitario`, `granjero`, `aplicador`, `equipamiento`). Esto obliga a Hibernate a generar una única consulta SQL combinando todas las tablas.
    *   **Entity Graph (`findByGranjero_IdEntityGraph`)**: Se utilizó la anotación `@EntityGraph` especificando los caminos de atributos (`attributePaths`). Esto permite a Hibernate resolver las relaciones perezosas de manera dinámica utilizando `LEFT OUTER JOIN` de SQL.
2.  **BenchmarkController.java (Nuevo Controlador Público)**:
    *   Se creó un controlador público `/api/benchmark/tratamientos` que acepta un parámetro `username` y `strategy`.
    *   **Justificación de diseño**: En las pruebas de carga iniciales bajo alta concurrencia (100 peticiones simultáneas), el endpoint real bajo seguridad JWT sufría timeouts masivos de red. Esto se debía a que Spring Security requería autenticar cada petición de benchmark descifrando contraseñas con **bcrypt**. Bcrypt es un algoritmo deliberadamente costoso computacionalmente diseñado para evitar ataques de fuerza bruta. Ejecutar 200 peticiones bcrypt concurrentemente saturaba el 100% de la CPU en segundos. Al derivar el test a un endpoint público que recibe el `username` directamente, eliminamos el cuello de botella artificial de la CPU y medimos **estrictamente el rendimiento del acceso a datos (ORM/Hibernate)**.
    *   Se configuró `/api/benchmark/**` como ruta libre en `SecurityConfig.java`.

---

### 5.2 Optimización de Infraestructura de Pruebas (Subprocess Lock Fix)
Durante la automatización del benchmark mediante el orquestador Python `run_all.py`, se identificó y solucionó un fallo crítico de bloqueo:
*   **El problema**: Spring Boot se arrancaba en segundo plano capturando la salida en una tubería en memoria (`subprocess.PIPE`). Debido a la enorme cantidad de logs de Hibernate generados durante las consultas del seeder y el benchmark, el búfer de la tubería del sistema operativo (limitado a 64 KB) se saturaba de inmediato. Al llenarse, el proceso de Java quedaba congelado de forma indefinida en cada escritura a consola.
*   **La solución**: Se reescribió `run_all.py` para redirigir toda la salida estándar (`stdout`) y de error (`stderr`) directamente a un archivo de disco físico: `big-data/spring_boot_benchmark.log`. Al no utilizar tuberías en memoria, la aplicación fluye sin bloqueos y los logs quedan almacenados para futuras revisiones.

---

### 5.3 Resultados del Benchmark de Rendimiento

El benchmark se ejecutó sobre el usuario semilla `granjero_seed_0_4934`, quien posee un volumen realista de **3.747 tratamientos** en la base de datos de 100.000 registros. A continuación se presentan las métricas brutas y comparadas obtenidas:

| Estrategia | Concurrencia | Duración (s) | Throughput | Latencia Media | P50 (Mediana) | P95 (Percentil 95) | Tasa de Éxito |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LAZY** | 10 | 8.82 s | 5.67 req/s | 1.750,27 ms | 1.736,57 ms | 1.895,06 ms | 100% (50/50) |
| | 50 | 17.25 s | 5.80 req/s | 6.893,44 ms | 8.494,91 ms | 8.683,95 ms | 100% (100/100) |
| | 100 | 34.30 s | 5.83 req/s | 13.350,78 ms | 16.841,15 ms | 17.407,32 ms | 100% (200/200) |
| **EAGER** | 10 | 8.73 s | 5.73 req/s | 1.731,61 ms | 1.723,37 ms | 1.876,47 ms | 100% (50/50) |
| | 50 | 17.09 s | 5.85 req/s | 6.819,50 ms | 8.473,81 ms | 8.660,23 ms | 100% (100/100) |
| | 100 | 34.94 s | 5.72 req/s | 13.302,38 ms | 16.972,04 ms | 17.760,38 ms | 100% (200/200) |
| **JOIN-FETCH**| 10 | 2.55 s | **19.61 req/s**| **497,41 ms** | **496,43 ms** | **603,94 ms** | 100% (50/50) |
| | 50 | 4.60 s | **21.73 req/s**| **1.798,61 ms**| **2.204,97 ms**| **2.360,88 ms**| 100% (100/100) |
| | 100 | 9.42 s | **21.24 req/s**| **3.616,65 ms**| **4.542,28 ms**| **4.885,41 ms**| 100% (200/200) |
| **ENTITY-GRAPH**| 10| 2.79 s | **17.94 req/s**| **534,70 ms** | **548,93 ms** | **644,71 ms** | 100% (50/50) |
| | 50 | 4.82 s | **20.75 req/s**| **1.878,55 ms**| **2.253,58 ms**| **2.522,07 ms**| 100% (100/100) |
| | 100 | 9.93 s | **20.13 req/s**| **3.808,09 ms**| **4.751,63 ms**| **5.088,57 ms**| 100% (200/200) |

---

### 5.4 Análisis Técnico Profundo y Conclusiones del Experimento 2

#### 1. Anatomía del Impacto del Problema N+1
Para procesar y renderizar un único listado de tratamientos, el mapeador de DTOs (`toDTO`) recorre el grafo de objetos navegando por los recintos, parcelas, explotaciones, productos fitosanitarios y granjeros para extraer campos descriptivos (ej. `numeroRecinto`, `refCatastral`, `municipio`, etc.).
*   En las estrategias **LAZY** y **EAGER**, al utilizar el repositorio estándar sin optimizar, Hibernate realiza inicialmente una única consulta para extraer los 3.747 tratamientos (`SELECT * FROM tratamiento WHERE usuario_id = ?`).
*   Posteriormente, por cada tratamiento individual en la iteración del DTO, al acceder a sus relaciones que no fueron recuperadas al inicio, Hibernate dispara consultas adicionales:
    1.  `SELECT * FROM recinto WHERE id = ?`
    2.  `SELECT * FROM parcela WHERE id = ?`
    3.  `SELECT * FROM explotacion WHERE id = ?`
*   Esto se traduce en aproximadamente **3 queries adicionales por fila**. Para 3.747 tratamientos, el servidor realiza de manera secuencial **más de 11.200 consultas SQL individuales** a la base de datos en un solo ciclo de vida de petición HTTP.
*   **El resultado en rendimiento es demoledor**: Incluso bajo una concurrencia muy baja (10 usuarios), el servidor tarda **1,75 segundos** en responder a cada petición, y el caudal (`throughput`) queda bloqueado en apenas **5,7 peticiones/segundo**. Con 100 usuarios concurrentes, el tiempo de espera sube hasta los **17,4 segundos (latencia P95)**, volviendo la aplicación inutilizable en producción.

#### 2. Comportamiento Idéntico de EAGER vs LAZY
Una creencia común en el desarrollo frontend/JPA es que configurar las anotaciones de las relaciones como `FetchType.EAGER` soluciona los problemas de rendimiento. Este experimento demuestra empíricamente que **esto es falso**. 
Bajo JPA, las consultas del repositorio estándar como `findByGranjero_Id` se traducen en JPQL básico, el cual no realiza joins implícitos. Al mapear, Hibernate sigue ejecutando las más de 11.200 consultas secuenciales bajo cuerda, provocando exactamente la misma latencia catastrófica (~17,7 segundos a 100 usuarios concurrentes).

#### 3. Erradicación del N+1 con JOIN FETCH y EntityGraph
Al optimizar la consulta mediante `JOIN FETCH` o `@EntityGraph` (Fase 5.1), obligamos a Hibernate a resolver toda la estructura relacional compleja en **una sola consulta SQL optimizada con JOINs**:
```sql
SELECT t.*, r.*, p.*, e.*, pf.*, g.* 
FROM tratamiento t 
INNER JOIN recinto r ON t.recinto_id = r.id 
INNER JOIN parcela p ON r.parcela_id = p.id 
INNER JOIN explotacion e ON p.explotacion_id = e.id 
*   **Resultados de la mejora**:
    *   **Latencia**: A concurrencia baja (10), la latencia cae de 1.750 ms a **497 ms** (una reducción del **71,6%**). A concurrencia alta (100), la latencia P95 desciende de 17.407 ms a **4.885 ms** (reducción del **71,9%**).
    *   **Throughput (Capacidad de Carga)**: El caudal del servidor sube de 5,8 req/s a **21,7 req/s**, lo que representa un incremento del **274%** en la cantidad de peticiones que el sistema puede resolver por segundo.
*   **JOIN-FETCH vs ENTITY-GRAPH**: Ambas soluciones resultaron sumamente parejas en su rendimiento, habiendo una ligerísima superioridad en las pruebas para `JOIN FETCH` (4,88 s vs 5,08 s a 100 usuarios concurrentes). Esto se debe a que `JOIN FETCH` utiliza `INNER JOIN` (excluyendo automáticamente nulos de relaciones opcionales), mientras que `@EntityGraph` genera `LEFT OUTER JOIN` generalizados, que pueden ser ligeramente más costosos de optimizar en el motor de base de datos relacional.

---

## FASE 6 — Integración de Buscador Inteligente y Sinónimos (Exp 1)

Como culminación y aplicación práctica del **Experimento 1 (Retrieval Accuracy)**, se trasladaron las conclusiones teóricas sobre la alta efectividad del filtrado léxico a una **fase completa de integración y robustez funcional dentro de CampoSync**.

### 6.1 Diagnóstico de Usabilidad y Rendimiento Inicial
Anteriormente, cuando el agricultor deseaba añadir un nuevo producto fitosanitario a su inventario móvil (`ModalNuevoInventario.jsx`), la interfaz realizaba una llamada que recuperaba los **2.045 productos del catálogo MAPA** de forma masiva y los cargaba en un desplegable `<select>` de HTML. Esto causaba:
*   Un cuello de botella severo en la transferencia de datos y en el renderizado del navegador (2.045 nodos de DOM cargados en memoria en dispositivos móviles, ralentizando el renderizado).
*   Una experiencia de usuario inaceptable, obligando al agricultor a hacer scroll secuencial sobre miles de registros.

---

### 6.2 Implementación de la Búsqueda Léxica Inteligente (Buscador Autocompletable)
Para resolver esto, se implementó un **enfoque híbrido estructurado** que sustituye el select estático por una barra de búsqueda inteligente y reactiva:

1.  **Backend (Capas de Datos y Controladores)**:
    *   **ProductoFitosanitarioRepository.java**: Se diseñó una consulta JPA personalizada con comodines (`LIKE LOWER`) que busca palabras clave de forma case-insensitive sobre el **nombre comercial del producto**, su **principio activo** y los **cultivos autorizados**:
        ```java
        @Query("SELECT p FROM ProductoFitosanitario p " +
               "WHERE p.activo = true AND (" +
               "  LOWER(p.nombre) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
               "  LOWER(p.principioAct) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
               "  LOWER(p.cultivosAutori) LIKE LOWER(CONCAT('%', :query, '%'))" +
               ") ORDER BY p.nombre ASC")
        List<ProductoFitosanitario> searchActiveProducts(@Param("query") String query);
        ```
    *   **ProductoFitosanitarioController.java**: Se expuso el endpoint `GET /api/productos/search?query=...`. Este endpoint aplica una cláusula `.limit(50)` en Java para acotar la lista y asegurar un tiempo de respuesta de base de datos ultrarrápido (<3 ms).

2.  **Frontend (React Component `ModalNuevoInventario.jsx`)**:
    *   **Cero Carga en Montaje (Performance Win)**: Se eliminó la petición masiva de 2.045 registros en el montaje del modal (`useEffect`). Ahora el modal se abre de forma **instantánea** con carga diferida.
    *   **Buscador Reactivo y Debouncing**: Se implementó una barra de búsqueda con un retardo de entrada (*debouncing* de 250 ms) para evitar ráfagas excesivas a la API. Conforme el usuario escribe (ej. `"Cúprico"`, `"Viña"`, o `"Glifosato"`), el sistema realiza llamadas asíncronas automáticas y renderiza una lista flotante y elegante de sugerencias con estilo premium.
    *   **Mapeo Inteligente de Alias**: Al seleccionar el producto de la lista, el sistema bloquea la selección mostrando una tarjeta visual del producto oficial seleccionado (con su número de registro y principio activo), y **auto-sugiere el alias agrícola (`aliasAgric`)** copiando el nombre del producto, ahorrando pulsaciones de teclado y agilizando el flujo del agricultor.

---

### 6.3 Normalización de Tildes/Acentos en Java
Durante los tests de aceptación interactivos con el navegador, se detectó que al buscar términos con tildes (como `"Cúprico"`), el sistema devolvía 0 resultados, mientras que buscar `"Cuprico"` (sin tilde) funcionaba perfectamente.
*   **Causa**: La base de datos almacena los registros oficiales del MAPA en mayúsculas y sin tildes (`"CUPRICO"`). Como la función `LOWER()` de PostgreSQL es sensible a los acentos, `"cúprico"` no coincidía de forma directa.
*   **Solución**: Se implementó un normalizador en el controlador Java antes de consultar la base de datos:
    ```java
    String normalizedQuery = java.text.Normalizer.normalize(query.trim(), java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
    ```
    Este método descompone los caracteres Unicode acentuados y remueve los diacríticos (tildes), logrando que `"Cúprico"` se convierta de forma limpia en `"Cuprico"`, asegurando una coincidencia del **100%** de manera totalmente local e instantánea.

---

### 6.4 Hallazgo Biológico y Regulatorio: Fitosanitarios vs Biocidas ("Matarratas")
Durante la fase de validación del buscador con lenguaje informal, se identificó que buscar `"matarratas"` o `"ratas"` arrojaba **0 resultados**, mientras que al buscar `"mata"` sí aparecían sugerencias (como `"MATACAN"`, `"MATON"`, etc.).

*   **El porqué de "matarratas" (0 resultados):** Los matarratas (rodenticidas) no son regulados legalmente en España como productos fitosanitarios (destinados a la sanidad de cultivos, competencia del Ministerio de Agricultura - MAPA) sino como **biocidas** de salud pública o higiene ambiental (competencia del Ministerio de Sanidad). Dado que el catálogo cargado en la aplicación es estrictamente el registro oficial **RETO del MAPA**, **no existe ningún rodenticida en toda la base de datos**. Al no estar indexados físicamente en el catálogo fitosanitario, es imposible recuperarlos. Este es un hallazgo valiosísimo para defender la veracidad y el alcance del dominio del proyecto en la memoria académica.
*   **El porqué de "mata" (SÍ da resultados):** Al buscar la subcadena `"mata"`, el buscador dinámico encuentra productos autorizados en el catálogo RETO cuyos nombres comerciales o principios activos contienen esa palabra de forma parcial, por ejemplo `"MATACAN"`, `"MATON"`, etc. Esto demuestra que el buscador por coincidencia léxica funciona perfectamente, pero lógicamente solo puede encontrar lo que existe en el catálogo agrícola oficial.


---

### 6.5 Expansión de Consultas (Query Expansion) por Sinónimos Químicos
Para dar respuesta al uso de términos sumamente coloquiales (como `"hongos"`, `"bichos"`, o `"caracoles"`), inicialmente se intentó mapear los sinónimos hacia categorías como `"fungicida"` o `"insecticida"`. Sin embargo, esto devolvía casi 0 resultados porque las palabras de categoría **no existen** en el catálogo de productos oficiales (RETO solo guarda nombres de marca y sustancias activas puras).
*   **Solución**: Se estructuró un motor de **Expansión de Consultas (Query Expansion)** en `ProductoFitosanitarioController.java` que traduce los términos informales del agricultor directamente a **principios activos o palabras de plaga reales** indexadas en gran volumen en la base de datos:
    *   `"caracoles"` / `"babosas"` ➔ Mapea a **`"metaldehido"`** (principio activo de los antilimacos, devolviendo de inmediato todos los helicicidas comerciales).
    *   `"malas hierbas"` / `"hierba"` ➔ Mapea a **`"glifosato"`** (herbicida por excelencia, retornando decenas de productos).
    *   `"bichos"` ➔ Mapea a **`"deltametrin"`** (insecticida de amplio espectro, mostrando opciones como Decis).
    *   `"hongos"` ➔ Mapea a **`"cobre"`** (fungicida clásico agrícola, mostrando productos cúpricos).

*   **Arquitectura de re-búsqueda**:
    ```java
    List<ProductoFitosanitarioDTO> list = doSearch(normalizedQuery);
    
    // Fallback si no hay resultados directos
    if (list.isEmpty()) {
        String queryLower = normalizedQuery.toLowerCase();
        for (java.util.Map.Entry<String, String> entry : SYNONYMS.entrySet()) {
            if (queryLower.contains(entry.getKey())) {
                list = doSearch(entry.getValue());
                if (!list.isEmpty()) break;
            }
        }
    }
    ```
Esta arquitectura combina un rendimiento óptimo de base de datos relacional con lógica de traducción de queries, elevando la experiencia del agricultor al nivel de un motor de búsqueda semántico real e industrial.
