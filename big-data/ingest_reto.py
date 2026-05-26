"""
ingest_reto.py — Genera embeddings del catálogo RETO e inserta en pgvector

Lee data/reto_productos.csv (output de reto_scraper.py), genera un embedding
por producto con sentence-transformers y hace UPSERT en la tabla
producto_fitosanitario (columna embedding vector(384)).

Modelo: paraphrase-multilingual-MiniLM-L12-v2
  - 384 dimensiones
  - Multilingüe (cubre español informal/coloquial)
  - Ligero: ~120MB, corre en CPU sin problemas

Uso:
    python ingest_reto.py              # procesa todo
    python ingest_reto.py --test       # test de conexión + 5 productos de prueba
    python ingest_reto.py --batch 64   # tamaño de batch (default: 32)
"""

import argparse
import os
from pathlib import Path

import pandas as pd
import psycopg2
from dotenv import load_dotenv
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# ── Config ────────────────────────────────────────────────────────────────────

load_dotenv(Path(__file__).parent.parent / ".env")  # .env está en la raíz de camposync/

CSV_PATH = Path(__file__).parent / "data" / "reto_productos.csv"
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"


# ── DB ────────────────────────────────────────────────────────────────────────

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


def test_connection():
    print("Verificando conexión a PostgreSQL...")
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT version();")
    print(f"  PostgreSQL: {cur.fetchone()[0][:50]}")

    cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
    ext = cur.fetchone()
    if ext:
        print("  pgvector: ACTIVO")
    else:
        print("  pgvector: NO ENCONTRADO — ejecuta V14__pgvector_embeddings.sql con Flyway")
        conn.close()
        return False

    cur.execute("SELECT COUNT(*) FROM producto_fitosanitario;")
    count = cur.fetchone()[0]
    print(f"  productos en DB: {count}")

    cur.execute("""
        SELECT COUNT(*) FROM producto_fitosanitario
        WHERE embedding IS NOT NULL;
    """)
    with_emb = cur.fetchone()[0]
    print(f"  con embedding: {with_emb}")

    conn.close()
    return True


# ── Embedding ─────────────────────────────────────────────────────────────────

def build_embedding_text(row: pd.Series) -> str:
    """
    Construye el texto a vectorizar por producto.
    Combina nombre + principio activo + cultivos + plagas para maximizar
    la similitud con consultas informales de agricultores.
    """
    parts = []
    if pd.notna(row.get("nombre")) and row["nombre"]:
        parts.append(str(row["nombre"]))
    if pd.notna(row.get("principio_act")) and row["principio_act"]:
        parts.append(str(row["principio_act"]))
    if pd.notna(row.get("cultivos_autori")) and row["cultivos_autori"]:
        # Tomar los primeros 200 chars para no sobrecargar el contexto del modelo
        parts.append(str(row["cultivos_autori"])[:200])
    if pd.notna(row.get("plagas")) and row["plagas"]:
        parts.append(str(row["plagas"])[:200])
    return " | ".join(parts)


# ── UPSERT ────────────────────────────────────────────────────────────────────

UPSERT_SQL = """
INSERT INTO producto_fitosanitario
    (nombre, principio_act, num_reg, cultivos_autori, fecha_cadu, activo,
     dosis_min, dosis_max, unidad_dosis_oficial, embedding, created_at, updated_at)
VALUES
    (%s, %s, %s, %s, %s::date, %s, %s, %s, %s, %s, NOW(), NOW())
ON CONFLICT (num_reg)
DO UPDATE SET
    nombre               = EXCLUDED.nombre,
    principio_act        = EXCLUDED.principio_act,
    cultivos_autori      = EXCLUDED.cultivos_autori,
    fecha_cadu           = EXCLUDED.fecha_cadu,
    activo               = EXCLUDED.activo,
    dosis_min            = EXCLUDED.dosis_min,
    dosis_max            = EXCLUDED.dosis_max,
    unidad_dosis_oficial = EXCLUDED.unidad_dosis_oficial,
    embedding            = EXCLUDED.embedding,
    updated_at           = NOW();
"""


def upsert_batch(cur, rows: list[dict], embeddings):
    for row, emb in zip(rows, embeddings):
        def cap(val, n):
            return (str(val) or "")[:n] or None

        cur.execute(UPSERT_SQL, (
            cap(row.get("nombre"), 255),
            cap(row.get("principio_act"), 255),
            cap(row.get("num_reg"), 255),
            cap(row.get("cultivos_autori"), 1000),
            row.get("fecha_cadu") or None,
            bool(int(row.get("activo", 1))),
            float(row["dosis_min"]) if row.get("dosis_min") else None,
            float(row["dosis_max"]) if row.get("dosis_max") else None,
            cap(row.get("unidad_dosis"), 20),
            emb.tolist(),
        ))


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Ingestión RETO → pgvector")
    parser.add_argument("--test", action="store_true", help="Solo verifica conexión + 5 productos")
    parser.add_argument("--batch", type=int, default=32, help="Tamaño de batch para embeddings (default: 32)")
    args = parser.parse_args()

    # Test de conexión
    if not test_connection():
        return

    # Cargar CSV
    if not CSV_PATH.exists():
        print(f"\nError: {CSV_PATH} no existe. Ejecuta primero reto_scraper.py")
        return

    df = pd.read_csv(CSV_PATH, dtype=str).fillna("")
    print(f"\nCSV cargado: {len(df)} productos")

    if args.test:
        df = df.head(5)
        print("Modo --test: procesando solo 5 productos")

    # Cargar modelo
    print(f"\nCargando modelo: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    print("Modelo cargado.")

    # Generar textos a vectorizar
    texts = [build_embedding_text(row) for _, row in df.iterrows()]

    # Conectar DB
    conn = get_connection()
    register_vector(conn)
    cur = conn.cursor()

    # Añadir constraint UNIQUE en num_reg si no existe (necesaria para ON CONFLICT)
    cur.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'producto_fitosanitario_num_reg_key'
            ) THEN
                ALTER TABLE producto_fitosanitario ADD CONSTRAINT producto_fitosanitario_num_reg_key UNIQUE (num_reg);
            END IF;
        END $$;
    """)
    conn.commit()

    # Procesar en batches
    total = len(df)
    inserted = 0

    for i in tqdm(range(0, total, args.batch), desc="Generando embeddings + UPSERT"):
        batch_rows = df.iloc[i:i + args.batch].to_dict("records")
        batch_texts = texts[i:i + args.batch]

        embeddings = model.encode(batch_texts, normalize_embeddings=True, show_progress_bar=False)
        upsert_batch(cur, batch_rows, embeddings)
        conn.commit()
        inserted += len(batch_rows)

    cur.close()
    conn.close()

    print(f"\nIngestión completada: {inserted} productos procesados en producto_fitosanitario")
    print("Columna 'embedding' actualizada con vectores de 384 dims.")


if __name__ == "__main__":
    main()
