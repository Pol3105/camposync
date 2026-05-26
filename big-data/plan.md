# Plan Big Data — CampoSync

> Rama: `BigData` | Entrega: 23 julio 2026 | Presentación: 24 julio 2026

---

## FASE 0 — Entorno Big Data
**Estado: PENDIENTE**

- [x] **0.1** Cambiar imagen Docker: `postgres:15-alpine` → `pgvector/pgvector:pg15`
- [x] **0.2** Crear migration Flyway `V14__pgvector_embeddings.sql`:
  - `CREATE EXTENSION IF NOT EXISTS vector`
  - `ALTER TABLE producto_fitosanitario ADD COLUMN embedding vector(384)`
  - `CREATE INDEX ivfflat` sobre la columna embedding
- [x] **0.3** Fix `application.yaml`: cambiar `ddl-auto: create` → `validate` (evita borrar datos de experimentos al reiniciar)
- [x] **0.4** Crear `big-data/requirements.txt` con dependencias Python:
  - `sentence-transformers`, `pgvector`, `psycopg2`, `rank-bm25`, `scikit-learn`, `pandas`, `matplotlib`, `seaborn`, `requests`

---

## FASE 1 — Ingesta RETO (vector store)
**Estado: EN PROGRESO** | Carpeta: `big-data/` (raíz de big-data)

- [x] **1.1** `reto_scraper.py` — descarga y parsea el catálogo oficial RETO (JSON, no XML)
  - Output: `data/reto_productos.csv` — **2045 productos reales** con cultivos, plagas y dosis
- [x] **1.2** `ingest_reto.py` — genera embeddings con `paraphrase-multilingual-MiniLM-L12-v2`
  - Lee CSV → genera vector(384) por producto → inserta en columna `embedding` de `producto_fitosanitario`
- [x] **1.3** Verificación manual: query "manzana pulgon" → top-5 devuelve productos para manzano con similitud ~0.53-0.56 ✅

---

## FASE 2 — Dataset anotado (base de Exp1)
**Estado: COMPLETADO** | Carpeta: `big-data/exp1-retrieval/data/`

- [x] **2.1** Script `generate_dataset.py` genera queries automáticamente desde RETO
  - 7 tipos de variante por producto: exacto, parcial, principio activo, cultivo+plaga, cultivo solo, typo, minúscula
- [x] **2.2** `queries_annotated.csv` — **841 queries** anotadas (fácil: 150, media: 373, difícil: 318)

---

## FASE 3 — Experimento 1: Retrieval Accuracy
**Estado: COMPLETADO** | Carpeta: `big-data/exp1-retrieval/`

Objetivo: comparar 4 métodos de recuperación. Resultado inesperado: TF-IDF supera a embeddings (análisis documentado en explicacion.md).

- [x] **3.1** `scripts/exact_match.py` — búsqueda exacta por nombre
- [x] **3.2** `scripts/tfidf.py` — sklearn TF-IDF vectorizer
- [x] **3.3** `scripts/bm25.py` — rank-bm25
- [x] **3.4** `scripts/embeddings_pgvector.py` — sentence-transformers + ANN pgvector (cosine similarity)
- [x] **3.5** `evaluate.py` — corre los 4 métodos sobre el dataset anotado
  - Métricas: **Precision@1, Recall@5, F1-Score**
  - Output: `results/metrics_comparison.csv` + `results/metrics_chart.png`
- [x] **3.6** Análisis de resultados:

| Método | P@1 | R@5 | F1 |
|--------|-----|-----|----|
| Exact Match | 0.345 | 0.345 | 0.345 |
| TF-IDF | 0.537 | 0.738 | **0.622** |
| BM25 | 0.533 | 0.687 | 0.600 |
| Embeddings (paraphrase) | 0.050 | 0.064 | 0.056 |

Hallazgo clave: TF-IDF supera a embeddings 11x en F1 global. Ver explicacion.md §3.6.

---

## FASE 4 — Seeder 100k registros (base de Exp2)
**Estado: COMPLETADO** | Carpeta: `big-data/exp2-query-performance/data/`

- [x] **4.1** `seed_100k.py` — genera datos realistas a escala:
  - ~1.000 explotaciones, ~5.000 parcelas, ~15.000 recintos, **100.000 tratamientos**
  - Usa productos RETO reales ya ingestados
  - Verifica integridad referencial antes de insertar
- [x] **4.2** Verificar: `SELECT COUNT(*) FROM tratamiento` → 100.000


---

## FASE 5 — Experimento 2: Query Performance (N+1)
**Estado: COMPLETADO** | Carpeta: `big-data/exp2-query-performance/`

Objetivo: cuantificar el impacto del problema N+1 en ORM Hibernate y demostrar la mejora con JOIN FETCH / EntityGraph.

Contexto: `Tratamiento` tiene 5 relaciones LAZY → `Recinto`, `Granjero`, `ProductoFitosanitario`, `Aplicador`, `Equipamiento`. Cada listado dispara N+1 queries.

- [x] **5.1** Añadir variantes al repositorio JPA (en rama BigData):
  - `TratamientoRepository`: método con `@Query JOIN FETCH` y método con `@EntityGraph`
  - Variante EAGER: modificación puntual en controlador/servicio
- [x] **5.2** `scripts/benchmark.py` — mide latencia del endpoint `GET /api/benchmark/tratamientos` bajo carga:
  - Cargas concurrentes: 10, 50, 100 peticiones simultáneas
  - 4 estrategias: LAZY / EAGER / JOIN FETCH / EntityGraph
  - Métricas: latencia media, p50, p95, throughput (req/s), tasa de éxito
- [x] **5.3** `run_all.sh` — ejecuta los benchmarks de forma automática con la aplicación Spring Boot levantada y la DB sembrada con 100K registros
- [x] **5.4** Output: `results/latency_comparison.csv` + `results/latency_comparison.png` (gráfica generada automáticamente)
- [x] **5.5** Análisis: cuantificar reducción de latencia JOIN FETCH vs LAZY (reducción de latencia del **72%** en P95 bajo alta concurrencia de 100 usuarios, incremento del **260%** en throughput).

### Resumen de Resultados (3.747 tratamientos por petición):

| Estrategia | Concurrencia | Req. Totales | Throughput | Latencia Media | P50 (Mediana) | P95 | Éxito |
|------------|--------------|--------------|------------|----------------|---------------|-----|-------|
| **LAZY** (N+1) | 10 | 50 | 5.67 req/s | 1.750 ms | 1.736 ms | 1.895 ms | 100% |
| | 50 | 100 | 5.80 req/s | 6.893 ms | 8.494 ms | 8.683 ms | 100% |
| | 100 | 200 | 5.83 req/s | 13.350 ms | 16.841 ms | 17.407 ms | 100% |
| **EAGER** (N+1)| 10 | 50 | 5.73 req/s | 1.731 ms | 1.723 ms | 1.876 ms | 100% |
| | 50 | 100 | 5.85 req/s | 6.819 ms | 8.473 ms | 8.660 ms | 100% |
| | 100 | 200 | 5.72 req/s | 13.302 ms | 16.972 ms | 17.760 ms | 100% |
| **JOIN-FETCH** | 10 | 50 | **19.61 req/s** | **497 ms** | **496 ms** | **603 ms** | 100% |
| | 50 | 100 | **21.73 req/s** | **1.798 ms** | **2.204 ms** | **2.360 ms** | 100% |
| | 100 | 200 | **21.24 req/s** | **3.616 ms** | **4.542 ms** | **4.885 ms** | 100% |
| **ENTITY-GRAPH**| 10 | 50 | **17.94 req/s** | **534 ms** | **548 ms** | **644 ms** | 100% |
| | 50 | 100 | **20.75 req/s** | **1.878 ms** | **2.253 ms** | **2.522 ms** | 100% |
| | 100 | 200 | **20.13 req/s** | **3.808 ms** | **4.751 ms** | **5.088 ms** | 100% |

**Hallazgo clave**: JOIN FETCH y ENTITY GRAPH reducen la latencia de procesamiento P95 a una tercera parte de la original (reducción del 72% bajo carga de 100 usuarios concurrentes) y multiplican el throughput del servidor por **3.6x** al erradicar las consultas N+1 y reducirlas a una única consulta SQL optimizada con JOINs. EAGER y LAZY se comportan idénticos debido a que el mapper realiza la navegación del grafo de objetos por igual.

---

## FASE 6 — Informe final
**Estado: PENDIENTE** | Deadline: subir a Moodle el 23 julio 2026

Estructura del report académico:
- [ ] **6.1** Introducción + motivación (5Vs de CampoSync)
- [ ] **6.2** Arquitectura del sistema
- [ ] **6.3** Exp1: metodología, resultados, análisis, conclusión
- [ ] **6.4** Exp2: metodología, resultados, análisis, conclusión
- [ ] **6.5** Conclusiones generales + trabajo futuro
- [ ] **6.6** `big-data/README.md` con instrucciones de reproducibilidad paso a paso
- [ ] **6.7** Subir código a GitHub + Moodle

---

## Resumen de fechas clave

| Hito | Fecha |
|------|-------|
| Pitch inicial | 16 abril 2026 ✅ |
| Examen escrito | 24 junio o 8 julio 2026 |
| Entrega proyecto (informe + repo) | 23 julio 2026 |
| Presentación final (10 min) | 24 julio 2026 |
| Verbalizzazione | 31 julio 2026 |

---

## Notas técnicas

- Modelo embeddings: `paraphrase-multilingual-MiniLM-L12-v2` (384 dims, cubre español informal, ligero)
- DB: PostgreSQL 15 + pgvector (misma instancia Docker que la app)
- Los scripts Python conectan directo a la DB (no pasan por la API Spring Boot), excepto el benchmark de Exp2
- Rama `BigData` no debe mergear a `main` — es trabajo académico, no producción
