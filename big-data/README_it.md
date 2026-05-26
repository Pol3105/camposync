# Big Data — CampoSync

**Università degli Studi Roma Tre · AA 2025/2026 · Track SSB**
**Studente:** Pablo Rejón Camacho (Erasmus)
**Consegna:** 23 luglio 2026 | **Presentazione:** 24 luglio 2026

> 📄 Relazione accademica completa: [`informe_bigdata_camposync.pdf`](./informe_bigdata_camposync.pdf)
> 🇬🇧 English version: [`README.md`](./README.md)

---

## Descrizione del progetto

CampoSync è un motore di conformità fitosanitaria per le circa 900.000 aziende agricole spagnole. Questo branch `BigData` aggiunge uno strato di Big Data all'applicazione Spring Boot esistente, implementando due esperimenti:

- **Esp1 — Retrieval Accuracy:** confronto tra 4 metodi di ricerca sul catalogo ufficiale RETO (Ministero dell'Agricoltura spagnolo): Ricerca Esatta, TF-IDF, BM25 e Embeddings pgvector.
- **Esp2 — Query Performance (N+1):** benchmark del problema N+1 di Hibernate JPA con 100.000 record reali, confrontando 4 strategie di caricamento: LAZY, EAGER, JOIN FETCH, EntityGraph.

---

## Struttura delle cartelle

```
big-data/
├── data/
│   └── reto_productos.csv          ← catalogo RETO (2.045 prodotti — generato da reto_scraper.py)
├── exp1-retrieval/
│   ├── data/queries_annotated.csv  ← 841 query annotate (facile/media/difficile)
│   ├── generate_dataset.py         ← genera il dataset da reto_productos.csv
│   ├── evaluate.py                 ← esegue i 4 metodi e calcola le metriche
│   ├── scripts/
│   │   ├── exact_match.py
│   │   ├── tfidf.py
│   │   ├── bm25.py
│   │   └── embeddings_pgvector.py
│   └── results/
│       ├── metrics_comparison.csv
│       └── metrics_chart.png
├── exp2-query-performance/
│   ├── data/seed_100k.py           ← inserisce 100.000 trattamenti nel DB
│   ├── scripts/benchmark.py        ← benchmark HTTP dei 4 endpoint
│   ├── run_all.sh                  ← script di automazione completa
│   └── results/
│       ├── latency_comparison.csv
│       └── latency_comparison.png
├── ingest_reto.py                  ← genera gli embedding e fa UPSERT in pgvector
├── reto_scraper.py                 ← scarica il catalogo RETO dal MAPA
├── generate_report.py              ← genera la relazione PDF
├── requirements.txt
├── plan.md                         ← checklist attività (spagnolo)
└── explicacion.md                  ← diario tecnico con errori e soluzioni (spagnolo)
```

---

## Requisiti

| Strumento | Versione minima |
|-----------|----------------|
| Docker Desktop | 4.x |
| Python | 3.10+ |
| Java / Maven | 21 / 3.9+ |
| Node.js | 18+ |

---

## Riproducibilità passo per passo

### Passo 1 — Clone e switch al branch BigData

```bash
git clone <repo-url>
cd camposync
git checkout BigData
```

### Passo 2 — Variabili d'ambiente

Copiare `.env.example` in `.env` nella cartella radice di `camposync/`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agro_data
DB_USER=admin_saas
DB_PASSWORD=<password>
```

### Passo 3 — Avviare il database

```bash
docker compose up -d postgres
```

### Passo 4 — Applicare le migrazioni Flyway (include pgvector)

```bash
./mvnw spring-boot:run &
# Attendere "Started CamposyncApplication" (~30s) poi fermare con Ctrl+C
```

La migrazione `V14__pgvector_embeddings.sql` attiva l'estensione `vector`, aggiunge la colonna `embedding vector(384)` e crea l'indice ivfflat coseno su `producto_fitosanitario`.

> **Alternativa senza avviare l'app:**
> ```bash
> docker exec -i camposync-postgres psql -U admin_saas -d agro_data \
>   < src/main/resources/db/migration/V14__pgvector_embeddings.sql
> ```

### Passo 5 — Ambiente Python

```bash
cd big-data
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --only-binary=:all:
```

### Passo 6 — Scaricare il catalogo RETO

```bash
python reto_scraper.py
# Output: data/reto_productos.csv  (2.045 prodotti)
```

### Passo 7 — Inserire gli embedding in pgvector

```bash
python ingest_reto.py
# Genera vettori di 384 dimensioni per prodotto e fa UPSERT in producto_fitosanitario
# Durata stimata: ~15 secondi su CPU
```

---

## Esperimento 1 — Retrieval Accuracy

### Generare il dataset annotato

```bash
cd exp1-retrieval
python generate_dataset.py
# Output: data/queries_annotated.csv  (841 query)
```

### Eseguire la valutazione completa

```bash
python evaluate.py
# Esegue i 4 metodi → results/metrics_comparison.csv + results/metrics_chart.png
```

### Risultati

| Metodo | Precision@1 | Recall@5 | F1-Score |
|--------|-------------|----------|----------|
| Ricerca esatta | 0.345 | 0.345 | 0.345 |
| **TF-IDF** | **0.537** | **0.738** | **0.622** |
| BM25 | 0.533 | 0.687 | 0.600 |
| Embedding (pgvector) | 0.050 | 0.064 | 0.056 |

**Risultato chiave:** TF-IDF supera gli embedding di 11× in F1 globale. Il modello `paraphrase-multilingual-MiniLM-L12-v2` è un modello simmetrico di parafrasi, non adatto al retrieval asimmetrico con nomi commerciali specializzati.

---

## Esperimento 2 — Query Performance (N+1)

### Popolare il database con 100.000 trattamenti

```bash
cd exp2-query-performance/data
python seed_100k.py
```

### Eseguire il benchmark

```bash
# In un terminale: avviare Spring Boot
./mvnw spring-boot:run

# In un altro terminale:
cd big-data/exp2-query-performance
./run_all.sh
```

### Risultati (3.747 trattamenti per richiesta)

| Strategia | Concorrenza | Throughput | Lat. media | P95 |
|-----------|------------|------------|------------|-----|
| LAZY (N+1) | 100 | 5.83 req/s | 13.350 ms | 17.407 ms |
| EAGER (N+1) | 100 | 5.72 req/s | 13.302 ms | 17.760 ms |
| **JOIN FETCH** | **100** | **21.24 req/s** | **3.617 ms** | **4.885 ms** |
| EntityGraph | 100 | 20.13 req/s | 3.808 ms | 5.089 ms |

**JOIN FETCH elimina il problema N+1**: throughput 3.6× superiore, latenza P95 ridotta del 72% rispetto a LAZY/EAGER.

---

## Fase 6 — Integrazione in produzione (ricerca intelligente)

I risultati dell'Esp1 sono stati trasferiti all'interfaccia reale di CampoSync:

- **Endpoint:** `GET /api/productos/search?query=...` → ricerca lessicale con LIKE su nome, principio attivo e colture autorizzate. Massimo 50 risultati, tempo di risposta <3 ms.
- **Normalizzazione accenti:** Java `Normalizer.NFD` rimuove i diacritici prima della query.
- **Espansione delle query:** termini colloquiali mappati a principi attivi reali (`"funghi"` → `"cobre"`, `"lumache"` → `"metaldehido"`).
- **Frontend:** debouncing 250ms e caricamento differito (il modal si apre istantaneamente).

---

## Note

- Il branch `BigData` **non deve fare merge su `main`** — lavoro accademico.
- Il file `.env` non è committato — contiene credenziali reali.
- Il modello di embedding si scarica automaticamente da HuggingFace al primo avvio (~120 MB).
- Per rigenerare la relazione PDF: `python generate_report.py`
