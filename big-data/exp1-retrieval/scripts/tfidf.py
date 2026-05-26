"""
tfidf.py — Recuperación por TF-IDF (sklearn)

Vectoriza el corpus con TfidfVectorizer sobre texto compuesto por
nombre + principio_act + cultivos_autori + plagas.
Para cada query calcula similitud coseno contra todos los productos
y devuelve los top-k por ranking.
"""

import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

RETO_CSV = Path(__file__).parent.parent.parent / "data" / "reto_productos.csv"


def build_corpus_text(row: pd.Series) -> str:
    parts = [
        str(row.get("nombre") or ""),
        str(row.get("principio_act") or ""),
        str(row.get("cultivos_autori") or "")[:200],
        str(row.get("plagas") or "")[:200],
    ]
    return " ".join(p for p in parts if p)


def build_index(df: pd.DataFrame):
    """Retorna (vectorizer, tfidf_matrix, num_regs)."""
    corpus = [build_corpus_text(row) for _, row in df.iterrows()]
    num_regs = df["num_reg"].astype(str).tolist()

    vectorizer = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(corpus)
    return vectorizer, matrix, num_regs


def search_top_k(query: str, vectorizer, matrix, num_regs: list[str], k: int = 5) -> list[str]:
    q_vec = vectorizer.transform([query])
    sims = cosine_similarity(q_vec, matrix).flatten()
    top_idx = np.argsort(sims)[::-1][:k]
    return [num_regs[i] for i in top_idx if sims[i] > 0]


def run(queries_df: pd.DataFrame, productos_df: pd.DataFrame, k: int = 5) -> pd.DataFrame:
    vectorizer, matrix, num_regs = build_index(productos_df)
    resultados = []
    for _, row in queries_df.iterrows():
        top_k = search_top_k(row["query_text"], vectorizer, matrix, num_regs, k)
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
