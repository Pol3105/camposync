# Diario Tecnico — Big Data CampoSync

Registro cronologico di tutto ciò che è stato implementato, perché, e come annullarlo se necessario.
Versione italiana del file `explicacion.md` (versione completa in spagnolo).

---

## FASE 0 — Ambiente Big Data

### 0.1 Docker: cambio immagine PostgreSQL
**File:** `docker-compose.yml`
**Modifica:** `postgres:15-alpine` → `pgvector/pgvector:pg15`

**Perché:** L'immagine originale non include l'estensione `vector` richiesta da pgvector per memorizzare gli embedding. La nuova immagine è esattamente postgres:15 con l'estensione preinstallata — stesso motore, stesso protocollo, stessi dati.

**Sicurezza dei dati:** Il volume `postgres_data` è indipendente dall'immagine Docker. Cambiando immagine i dati rimangono intatti.

**Per annullare:** In `docker-compose.yml`, commentare `pgvector/pgvector:pg15` e decommentare `postgres:15-alpine`.

---

### 0.2 Migrazione Flyway V14 — pgvector
**File:** `src/main/resources/db/migration/V14__pgvector_embeddings.sql`

**Cosa fa:**
1. `CREATE EXTENSION IF NOT EXISTS vector` — attiva pgvector nel DB
2. `ALTER TABLE producto_fitosanitario ADD COLUMN embedding vector(384)` — aggiunge colonna per gli embedding del catalogo RETO. 384 dimensioni = dimensione di output del modello `paraphrase-multilingual-MiniLM-L12-v2`
3. `CREATE INDEX ivfflat` — indice di ricerca approssimata (ANN) con similarità coseno. `lists=100` è il valore consigliato per ~10k righe

---

### 0.3 Fix application.yaml — ddl-auto
**File:** `src/main/resources/application.yaml`
**Modifica:** `ddl-auto: create` → `ddl-auto: validate`

**Perché era un problema:** Con `create`, Hibernate cancellava e ricreava tutte le tabelle ad ogni avvio dell'app — distruggerebbe i 100k record del seeder e gli embedding ad ogni riavvio.

**Perché `validate` è corretto:** Flyway gestisce già lo schema completo. Hibernate deve solo verificare che le entità corrispondano allo schema esistente.

---

### 0.4 requirements.txt — dipendenze Python
**File:** `big-data/requirements.txt`

- **sentence-transformers + torch** — generare embedding (Esp1)
- **psycopg2-binary + pgvector + sqlalchemy** — connessione a PostgreSQL e uso delle colonne vector
- **rank-bm25 + scikit-learn** — baseline TF-IDF e BM25 (Esp1)
- **pandas + numpy** — manipolazione dataset
- **matplotlib + seaborn** — grafici dei risultati
- **requests + httpx** — benchmark HTTP per Esp2
- **python-dotenv** — leggere variabili d'ambiente (.env) per la connessione al DB
- **reportlab** — generazione PDF della relazione accademica

**Errori risolti:** `torch==2.3.1` non aveva wheel per Python 3.14 → cambiato in `torch>=2.9.0` + `--only-binary=:all:`

---

## FASE 1 — Ingesta RETO (vector store)

### 1.1 reto_scraper.py
**File:** `big-data/reto_scraper.py`

**Cosa fa:** Scarica e analizza il catalogo ufficiale RETO (Ministero dell'Agricoltura spagnolo) e genera `data/reto_productos.csv`.

**Endpoint reale:** `POST /regfiweb/Exportaciones/ExportJsonProductosAutorizados` (non XML come inizialmente previsto — il MAPA usa JSON con doppia codifica).

**Errori risolti:**
1. URL originale 404 → scoperto il vero endpoint tramite analisi del sito
2. La risposta è JSON, non XML → riscritto completamente lo scraper
3. Risposta HTTP doppamente codificata come stringa JSON → analizzata in due passaggi
4. Campi reali MAPA diversi da quelli previsti: `Agente` (non `Plaga`), `Dosis_Min/Max`, `"Unidad Medida dosis"` con spazi nella chiave

**Risultato:** 2.045 prodotti del catalogo RETO vigente in `data/reto_productos.csv`

---

### 1.2 ingest_reto.py
**File:** `big-data/ingest_reto.py`

**Cosa fa:** Legge `data/reto_productos.csv`, genera un embedding di 384 dimensioni per prodotto con `sentence-transformers` e fa UPSERT in `producto_fitosanitario` (colonna `embedding`).

**Testo vettorizzato per prodotto:** `"{nome} {principio_attivo}"` — formato breve per massimizzare la similarità con query per nome.

**Errori risolti:**
1. `StringDataRightTruncation` su `unidad_dosis_oficial VARCHAR(20)` → troncato con `[:20]`
2. `StringDataRightTruncation` su `cultivos_autori VARCHAR(1000)` → troncato con `[:1000]`
3. `load_dotenv(Path('.').parent / '.env')` non risolveva correttamente → usato path assoluto `Path(__file__).parent.parent`

---

### 1.3 Verifica completata
- pgvector: ATTIVO in PostgreSQL 15.18
- 2.045 prodotti inseriti con embedding di 384 dimensioni ✅

---

## FASE 2 — Dataset annotato

### generate_dataset.py
**File:** `big-data/exp1-retrieval/generate_dataset.py`

**Cosa fa:** Prende 150 prodotti vigenti dal RETO casualmente e genera fino a 7 varianti di query per prodotto, simulando come un agricoltore reale cercherebbe quel prodotto.

**Risultato:** 841 query annotate — fácil: 150, media: 373, difícil: 318

---

## FASE 3 — Esperimento 1: Retrieval Accuracy

### Script di ricerca (3.1–3.4)
Tutti espongono `run(queries_df, productos_df) → DataFrame` con colonne `acierto_p1` e `acierto_r5`.

### evaluate.py (3.5)
Orchestra i 4 metodi, calcola Precision@1 / Recall@5 / F1-Score globale e per difficoltà.

### Errori risolti
`psycopg2` con cast `%s::vector` esplicito causava conflitto con `register_vector(conn)` → il vettore veniva passato come tipo errato e restituiva risultati casuali (P@1 = 1.9%). Soluzione: rimuovere il cast, usare solo `%s` e passare il numpy array direttamente.

### Risultati finali (841 query, 1.969 prodotti vigenti)

| Metodo | P@1 | R@5 | F1 globale |
|--------|-----|-----|------------|
| Ricerca esatta | 0.345 | 0.345 | 0.345 |
| **TF-IDF** | **0.537** | **0.738** | **0.622** |
| BM25 | 0.533 | 0.687 | 0.600 |
| Embedding (paraphrase) | 0.050 | 0.064 | 0.056 |

### Risultato inaspettato — perché gli embedding falliscono

Il modello `paraphrase-multilingual-MiniLM-L12-v2` è un modello *simmetrico* addestrato per rilevare parafrasi. NON è progettato per retrieval asimmetrico (query breve → documento lungo). I nomi commerciali RETO ("RUNRUD", "CHANON") sono nomi propri fuori dal vocabolario del modello, producendo embedding con similarità coseno indistinguibile tra prodotti diversi (~0.65).

**Conclusione:** Per i cataloghi di prodotti fitosanitari con nomi commerciali, TF-IDF/BM25 sono la soluzione ottimale. Gli embedding richiedono un modello bi-encoder o un approccio ibrido BM25 + reranking semantico.

---

## FASE 4 — Seeder 100k record

**File:** `big-data/exp2-query-performance/data/seed_100k.py`

Genera ~1.000 aziende, ~5.000 appezzamenti, ~15.000 particelle, **100.000 trattamenti** usando prodotti RETO reali già inseriti nel DB.

---

## FASE 5 — Esperimento 2: Query Performance (N+1)

### Problema N+1 in Hibernate
`Tratamiento` ha 5 relazioni LAZY → `Recinto`, `Granjero`, `ProductoFitosanitario`, `Aplicador`, `Equipamiento`. Ogni listato genera fino a 5N+1 query SQL.

### Varianti aggiunte al repository JPA
- `TratamientoRepository`: metodo con `@Query JOIN FETCH` e metodo con `@EntityGraph`

### Risultati benchmark (3.747 trattamenti/richiesta)

| Strategia | Concorrenza | Throughput | Lat. P95 | Miglioramento |
|-----------|------------|------------|----------|---------------|
| LAZY (N+1) | 100 | 5.83 req/s | 17.407 ms | — |
| EAGER (N+1) | 100 | 5.72 req/s | 17.760 ms | ≈ LAZY |
| **JOIN FETCH** | **100** | **21.24 req/s** | **4.885 ms** | **+264%, −72%** |
| EntityGraph | 100 | 20.13 req/s | 5.089 ms | +245%, −71% |

**Risultato chiave:** JOIN FETCH e EntityGraph riducono la latenza P95 del 72% e moltiplicano il throughput per 3.6× eliminando il problema N+1.

---

## FASE 6 — Integrazione in produzione

### 6.1 Barra di ricerca dinamica
Eliminato il dropdown statico di 2.045 prodotti. Sostituito con barca di ricerca con debouncing 250ms e caricamento differito.

### 6.2 Endpoint di ricerca
`GET /api/productos/search?query=...` — ricerca LIKE su nome, principio attivo e colture. Limite 50 risultati, <3 ms di risposta.

### 6.3 Normalizzazione accenti
Java `java.text.Normalizer NFD` rimuove i diacritici prima della query → "Cúprico" trova "CUPRICO".

### 6.4 Scoperta regolamentare
"Matarratas" (topicida) → 0 risultati. I rodenticidi sono biocidi regolati dal Ministero della Salute, non fitosanitari MAPA. Non esistono nel catalogo RETO per definizione legale.

### 6.5 Espansione delle query (Query Expansion)
Dizionario di sinonimi: "caracoles" → "metaldehido", "malas hierbas" → "glifosato", "bichos" → "deltametrin", "hongos" → "cobre". Architettura di ricerca con fallback automatico.

---

## FASE 7 — Relazione finale

- `big-data/README.md` — istruzioni di riproducibilità (inglese)
- `big-data/README_it.md` — istruzioni di riproducibilità (italiano)
- `big-data/explicacion_it.md` — questo file
- `big-data/informe_bigdata_camposync.pdf` — relazione accademica completa (inglese, 11 pagine)
- `big-data/generate_report.py` — script per rigenerare il PDF
