"""
embeddings_pgvector.py — Recuperación por embeddings + ANN pgvector

Genera un embedding por query con sentence-transformers y busca los k
productos más cercanos en PostgreSQL usando el índice ivfflat cosine.
Es el método principal que queremos demostrar que supera a los baselines.

Requiere: DB PostgreSQL con pgvector activo y embeddings ya ingestados
          (ejecutar ingest_reto.py antes de evaluate.py)
"""

import os
from pathlib import Path

import numpy as np
import pandas as pd
import psycopg2
from dotenv import load_dotenv
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer

load_dotenv(Path(__file__).parent.parent.parent.parent / ".env")

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

TOP_K_SQL = """
SELECT num_reg, nombre,
       1 - (embedding <=> %s) AS similitud
FROM producto_fitosanitario
WHERE embedding IS NOT NULL
ORDER BY embedding <=> %s
LIMIT %s;
"""


def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


def run(queries_df: pd.DataFrame, productos_df: pd.DataFrame, k: int = 5) -> pd.DataFrame:
    model = SentenceTransformer(MODEL_NAME)
    conn = get_connection()
    register_vector(conn)
    cur = conn.cursor()

    resultados = []
    texts = queries_df["query_text"].tolist()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=True, batch_size=64)

    for (_, row), emb in zip(queries_df.iterrows(), embeddings):
        cur.execute(TOP_K_SQL, (emb, emb, k))
        rows = cur.fetchall()
        top_k = [str(r[0]) for r in rows]
        correcto = str(row["num_reg_correcto"])
        resultados.append({
            "query_text":       row["query_text"],
            "num_reg_correcto": correcto,
            "nombre_correcto":  row["nombre_correcto"],
            "dificultad":       row["dificultad"],
            "pred_num_reg":     top_k[0] if top_k else None,
            "top_k":            top_k,
            "acierto_p1":       int(bool(top_k) and top_k[0] == correcto),
            "acierto_r5":       int(correcto in top_k),
        })

    cur.close()
    conn.close()
    return pd.DataFrame(resultados)
