"""
generate_dataset.py — Genera el dataset anotado de queries para Experimento 1

A partir del catálogo RETO genera ~500 consultas simulando cómo un agricultor
real buscaría un producto: nombre parcial, cultivo+plaga, principio activo,
nombre con errores tipográficos, etc.

Output: exp1-retrieval/data/queries_annotated.csv
Columnas: query_text, num_reg_correcto, nombre_correcto, dificultad

Uso:
    python3 generate_dataset.py
    python3 generate_dataset.py --muestra 150   # productos base (default: 150)
    python3 generate_dataset.py --seed 42
"""

import argparse
import csv
import random
import re
from pathlib import Path

import pandas as pd

RETO_CSV    = Path(__file__).parent.parent / "data" / "reto_productos.csv"
OUTPUT_CSV  = Path(__file__).parent / "data" / "queries_annotated.csv"

OUTPUT_FIELDS = ["query_text", "num_reg_correcto", "nombre_correcto", "dificultad"]


# ── Generadores de variantes ──────────────────────────────────────────────────

def gen_nombre_exacto(row) -> list[tuple[str, str]]:
    """Nombre comercial exacto. Dificultad: fácil."""
    nombre = row["nombre"].strip()
    if not nombre:
        return []
    return [(nombre, "facil")]


def gen_nombre_parcial(row) -> list[tuple[str, str]]:
    """Primera o dos primeras palabras del nombre. Dificultad: media."""
    palabras = row["nombre"].strip().split()
    if len(palabras) < 2:
        return []
    variantes = []
    variantes.append((palabras[0], "media"))
    if len(palabras) >= 2:
        variantes.append((" ".join(palabras[:2]), "media"))
    return variantes


def gen_principio_activo(row) -> list[tuple[str, str]]:
    """Nombre del principio activo limpio (sin porcentaje ni formulación). Dificultad: media."""
    pa = row.get("principio_act") or ""
    # Quitar todo lo que venga tras el número: "AZUFRE 80% [WG]..." → "AZUFRE"
    limpio = re.split(r"\s+\d", pa)[0].strip().lower()
    if not limpio or len(limpio) < 3:
        return []
    return [(limpio, "media")]


def gen_cultivo_plaga(row) -> list[tuple[str, str]]:
    """Primer cultivo + primera plaga. Simula consulta real del agricultor. Dificultad: difícil."""
    cultivos = [c.strip() for c in str(row.get("cultivos_autori") or "").split(";") if c.strip()]
    plagas   = [p.strip() for p in str(row.get("plagas") or "").split(";") if p.strip()]

    if not cultivos or not plagas:
        return []

    # Simplificar la plaga: quedarse solo con el nombre común (antes de la coma o del código EPPO)
    cultivo = cultivos[0].lower()
    plaga_raw = plagas[0]
    plaga = plaga_raw.split(",")[0].strip().lower()

    query = f"{cultivo} {plaga}"
    return [(query, "dificil")]


def gen_cultivo_solo(row) -> list[tuple[str, str]]:
    """Solo el cultivo principal. Muy ambiguo. Dificultad: difícil."""
    cultivos = [c.strip() for c in str(row.get("cultivos_autori") or "").split(";") if c.strip()]
    if not cultivos:
        return []
    return [(cultivos[0].lower(), "dificil")]


def gen_typo(row) -> list[tuple[str, str]]:
    """Nombre con error tipográfico: letra duplicada, intercambiada o eliminada. Dificultad: difícil."""
    nombre = row["nombre"].strip()
    if len(nombre) < 5:
        return []

    ops = ["dup", "swap", "del"]
    op  = random.choice(ops)
    idx = random.randint(1, len(nombre) - 2)

    if op == "dup":
        mutado = nombre[:idx] + nombre[idx] + nombre[idx:]
    elif op == "swap" and idx + 1 < len(nombre):
        lst = list(nombre)
        lst[idx], lst[idx + 1] = lst[idx + 1], lst[idx]
        mutado = "".join(lst)
    else:
        mutado = nombre[:idx] + nombre[idx + 1:]

    return [(mutado.lower(), "dificil")]


def gen_nombre_minuscula(row) -> list[tuple[str, str]]:
    """Nombre en minúscula sin guiones. Como lo escribe un agricultor. Dificultad: media."""
    nombre = row["nombre"].strip().lower().replace("-", " ")
    return [(nombre, "media")]


# ── Pipeline ──────────────────────────────────────────────────────────────────

GENERADORES = [
    gen_nombre_exacto,
    gen_nombre_parcial,
    gen_principio_activo,
    gen_cultivo_plaga,
    gen_cultivo_solo,
    gen_typo,
    gen_nombre_minuscula,
]


def generar_queries(df: pd.DataFrame, n_muestra: int) -> list[dict]:
    muestra = df.sample(min(n_muestra, len(df))).reset_index(drop=True)
    rows = []
    seen: set[str] = set()

    for _, row in muestra.iterrows():
        for gen in GENERADORES:
            for query_text, dificultad in gen(row):
                query_clean = query_text.strip()
                if not query_clean or query_clean in seen:
                    continue
                seen.add(query_clean)
                rows.append({
                    "query_text":      query_clean,
                    "num_reg_correcto": str(row["num_reg"]),
                    "nombre_correcto":  row["nombre"],
                    "dificultad":       dificultad,
                })

    return rows


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--muestra", type=int, default=150,
                        help="Nº de productos base para generar queries (default: 150)")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)

    if not RETO_CSV.exists():
        raise FileNotFoundError(f"No encontrado: {RETO_CSV}\nEjecuta primero reto_scraper.py")

    df = pd.read_csv(RETO_CSV, dtype=str).fillna("")
    # Solo productos vigentes
    df = df[df["activo"] == "1"].reset_index(drop=True)
    print(f"Productos vigentes disponibles: {len(df)}")

    queries = generar_queries(df, args.muestra)

    # Estadísticas
    facil   = sum(1 for q in queries if q["dificultad"] == "facil")
    media   = sum(1 for q in queries if q["dificultad"] == "media")
    dificil = sum(1 for q in queries if q["dificultad"] == "dificil")
    print(f"Queries generadas: {len(queries)}  (fácil: {facil}, media: {media}, difícil: {dificil})")

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        writer.writerows(queries)

    print(f"Dataset escrito: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
