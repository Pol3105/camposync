"""
bm25.py — Recuperación por BM25 (rank-bm25)

BM25 es el estándar de facto en recuperación de información clásica.
Mejora TF-IDF con normalización por longitud de documento y parámetros
k1/b ajustables. Se usa como baseline fuerte pre-neural.
"""

import pandas as pd
from pathlib import Path
from rank_bm25 import BM25Okapi

RETO_CSV = Path(__file__).parent.parent.parent / "data" / "reto_productos.csv"


def build_corpus_text(row: pd.Series) -> str:
    parts = [
        str(row.get("nombre") or ""),
        str(row.get("principio_act") or ""),
        str(row.get("cultivos_autori") or "")[:200],
        str(row.get("plagas") or "")[:200],
    ]
    return " ".join(p for p in parts if p)


def tokenize(text: str) -> list[str]:
    return text.lower().split()


def build_index(df: pd.DataFrame):
    """Retorna (bm25, num_regs)."""
    corpus_texts = [build_corpus_text(row) for _, row in df.iterrows()]
    tokenized = [tokenize(t) for t in corpus_texts]
    num_regs = df["num_reg"].astype(str).tolist()
    bm25 = BM25Okapi(tokenized)
    return bm25, num_regs


def search_top_k(query: str, bm25, num_regs: list[str], k: int = 5) -> list[str]:
    tokens = tokenize(query)
    scores = bm25.get_scores(tokens)
    import numpy as np
    top_idx = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
    return [num_regs[i] for i in top_idx if scores[i] > 0]


def run(queries_df: pd.DataFrame, productos_df: pd.DataFrame, k: int = 5) -> pd.DataFrame:
    bm25, num_regs = build_index(productos_df)
    resultados = []
    for _, row in queries_df.iterrows():
        top_k = search_top_k(row["query_text"], bm25, num_regs, k)
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
    return pd.DataFrame(resultados)
