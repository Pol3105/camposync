"""
evaluate.py — Evaluación comparativa de los 4 métodos de retrieval

Corre los 4 métodos sobre queries_annotated.csv y calcula:
  - Precision@1: el top-1 es el producto correcto
  - Recall@5:    el producto correcto está en los top-5
  - F1-Score:    media armónica de P@1 y R@5

Outputs:
  results/metrics_comparison.csv    — métricas por método y dificultad
  results/metrics_chart.png         — gráfica de barras comparativa

Uso:
    cd big-data/exp1-retrieval
    python evaluate.py                     # corre los 4 métodos
    python evaluate.py --skip-embeddings   # salta embeddings (sin DB)
    python evaluate.py --metodo exact      # solo un método (debug)
"""

import argparse
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # sin display (headless)
import matplotlib.pyplot as plt
import pandas as pd

# Rutas
BASE_DIR    = Path(__file__).parent
QUERIES_CSV = BASE_DIR / "data" / "queries_annotated.csv"
RETO_CSV    = BASE_DIR.parent / "data" / "reto_productos.csv"
RESULTS_DIR = BASE_DIR / "results"

sys.path.insert(0, str(BASE_DIR / "scripts"))
import exact_match
import tfidf
import bm25
import embeddings_pgvector


# ── Métricas ──────────────────────────────────────────────────────────────────

def calcular_metricas(df: pd.DataFrame, metodo: str) -> dict:
    """Calcula P@1, R@5, F1 globales y por dificultad."""
    registros = []

    for dif in ["global", "facil", "media", "dificil"]:
        subset = df if dif == "global" else df[df["dificultad"] == dif]
        n = len(subset)
        if n == 0:
            continue

        p1 = subset["acierto_p1"].mean() if "acierto_p1" in subset.columns else subset["acierto"].mean()
        r5 = subset["acierto_r5"].mean() if "acierto_r5" in subset.columns else subset["acierto"].mean()
        f1 = 2 * p1 * r5 / (p1 + r5) if (p1 + r5) > 0 else 0.0

        registros.append({
            "metodo":      metodo,
            "dificultad":  dif,
            "n_queries":   n,
            "precision_1": round(p1, 4),
            "recall_5":    round(r5, 4),
            "f1_score":    round(f1, 4),
        })

    return registros


# ── Grafica ───────────────────────────────────────────────────────────────────

def plot_metrics(results_df: pd.DataFrame, out_path: Path):
    global_df = results_df[results_df["dificultad"] == "global"].copy()
    metodos = global_df["metodo"].tolist()

    x = range(len(metodos))
    width = 0.25

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.bar([i - width for i in x], global_df["precision_1"], width, label="Precision@1", color="#4C72B0")
    ax.bar([i         for i in x], global_df["recall_5"],    width, label="Recall@5",    color="#55A868")
    ax.bar([i + width for i in x], global_df["f1_score"],    width, label="F1-Score",    color="#C44E52")

    ax.set_ylabel("Score")
    ax.set_title("Retrieval Accuracy — Comparativa de métodos\n(CampoSync · Exp1)")
    ax.set_xticks(list(x))
    ax.set_xticklabels(metodos, fontsize=11)
    ax.set_ylim(0, 1.05)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)

    for i, row in enumerate(global_df.itertuples()):
        ax.text(i - width, row.precision_1 + 0.01, f"{row.precision_1:.2f}", ha="center", fontsize=8)
        ax.text(i,         row.recall_5    + 0.01, f"{row.recall_5:.2f}",    ha="center", fontsize=8)
        ax.text(i + width, row.f1_score    + 0.01, f"{row.f1_score:.2f}",    ha="center", fontsize=8)

    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()
    print(f"Gráfica guardada: {out_path}")


# ── Main ──────────────────────────────────────────────────────────────────────

METODOS_DISPONIBLES = ["exact", "tfidf", "bm25", "embeddings"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-embeddings", action="store_true",
                        help="Omite el método embeddings_pgvector (sin conexión a DB)")
    parser.add_argument("--metodo", choices=METODOS_DISPONIBLES,
                        help="Ejecuta solo este método (debug)")
    args = parser.parse_args()

    # Cargar datos
    if not QUERIES_CSV.exists():
        sys.exit(f"No encontrado: {QUERIES_CSV}\nEjecuta generate_dataset.py primero.")
    if not RETO_CSV.exists():
        sys.exit(f"No encontrado: {RETO_CSV}\nEjecuta reto_scraper.py primero.")

    queries_df   = pd.read_csv(QUERIES_CSV, dtype=str).fillna("")
    productos_df = pd.read_csv(RETO_CSV, dtype=str).fillna("")
    productos_df = productos_df[productos_df["activo"] == "1"].reset_index(drop=True)

    print(f"Queries:   {len(queries_df)}")
    print(f"Productos: {len(productos_df)} vigentes")
    print()

    metodos_a_correr = [args.metodo] if args.metodo else METODOS_DISPONIBLES
    if args.skip_embeddings and "embeddings" in metodos_a_correr:
        metodos_a_correr.remove("embeddings")

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    todos_metricas = []

    for nombre_metodo in metodos_a_correr:
        print(f"▶ Corriendo: {nombre_metodo}")

        if nombre_metodo == "exact":
            df_res = exact_match.run(queries_df, productos_df)
            # exact_match solo tiene acierto (P@1), no top_k → forzar columnas compatibles
            df_res["acierto_p1"] = df_res["acierto"]
            df_res["acierto_r5"] = df_res["acierto"]  # exact no tiene top-5, asume P@1=R@5

        elif nombre_metodo == "tfidf":
            df_res = tfidf.run(queries_df, productos_df)

        elif nombre_metodo == "bm25":
            df_res = bm25.run(queries_df, productos_df)

        elif nombre_metodo == "embeddings":
            df_res = embeddings_pgvector.run(queries_df, productos_df)

        metricas = calcular_metricas(df_res, nombre_metodo)
        todos_metricas.extend(metricas)

        # Imprimir resumen global
        global_m = next(m for m in metricas if m["dificultad"] == "global")
        print(f"  P@1={global_m['precision_1']:.3f}  R@5={global_m['recall_5']:.3f}  F1={global_m['f1_score']:.3f}")
        print()

    # Guardar CSV resultados
    results_df = pd.DataFrame(todos_metricas)
    out_csv = RESULTS_DIR / "metrics_comparison.csv"
    results_df.to_csv(out_csv, index=False)
    print(f"Métricas guardadas: {out_csv}")

    # Gráfica (solo si hay más de 1 método)
    if len([m for m in todos_metricas if m["dificultad"] == "global"]) > 1:
        plot_metrics(results_df, RESULTS_DIR / "metrics_chart.png")

    # Resumen final por dificultad
    print("\n— Resumen por dificultad —")
    pivot = results_df.pivot_table(index="metodo", columns="dificultad", values="f1_score")
    print(pivot.to_string())


if __name__ == "__main__":
    main()
