"""
exact_match.py — Búsqueda exacta por nombre de producto

Para cada query busca el producto cuyo nombre coincide exactamente
(case-insensitive). Si no hay coincidencia exacta, devuelve None.
"""

import pandas as pd
from pathlib import Path

RETO_CSV = Path(__file__).parent.parent.parent / "data" / "reto_productos.csv"


def build_index(df: pd.DataFrame) -> dict[str, str]:
    """nombre_lower → num_reg"""
    return {row["nombre"].strip().lower(): str(row["num_reg"]) for _, row in df.iterrows()}


def search(query: str, index: dict[str, str]) -> str | None:
    return index.get(query.strip().lower())


def run(queries_df: pd.DataFrame, productos_df: pd.DataFrame) -> pd.DataFrame:
    index = build_index(productos_df)
    resultados = []
    for _, row in queries_df.iterrows():
        pred = search(row["query_text"], index)
        resultados.append({
            "query_text":       row["query_text"],
            "num_reg_correcto": row["num_reg_correcto"],
            "nombre_correcto":  row["nombre_correcto"],
            "dificultad":       row["dificultad"],
            "pred_num_reg":     pred,
            "acierto":          int(pred == str(row["num_reg_correcto"])) if pred else 0,
        })
    return pd.DataFrame(resultados)
