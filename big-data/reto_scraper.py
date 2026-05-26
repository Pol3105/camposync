"""
reto_scraper.py — Descarga y parsea el catálogo RETO del MAPA

Fuente: servicio.mapa.gob.es/regfiweb (endpoint JSON oficial)
Endpoint: POST /regfiweb/Exportaciones/ExportJsonProductosAutorizados

Uso:
    python3 reto_scraper.py            # descarga y parsea
    python3 reto_scraper.py --inspect  # muestra estructura JSON cruda (debug)

Output: data/reto_productos.csv
"""

import argparse
import csv
import json
import sys
from pathlib import Path

import requests
from tqdm import tqdm

MAPA_URL = "https://servicio.mapa.gob.es/regfiweb/Exportaciones/ExportJsonProductosAutorizados"
OUTPUT_CSV = Path(__file__).parent / "data" / "reto_productos.csv"

CSV_FIELDS = [
    "num_reg", "nombre", "principio_act", "titular",
    "fecha_cadu", "cultivos_autori", "plagas",
    "dosis_min", "dosis_max", "unidad_dosis", "activo",
]


# ── Descarga ──────────────────────────────────────────────────────────────────

def download_json() -> dict:
    print(f"Descargando catálogo RETO desde MAPA...")
    response = requests.post(
        MAPA_URL,
        headers={"Content-Length": "0"},
        timeout=120,
    )
    response.raise_for_status()

    # La respuesta es un string JSON doblemente codificado:
    # nivel 1: response.text = '"{ \"Id\": 1, \"Contenido\": \"...\" }"'  ← string JSON
    # nivel 2: json.loads(nivel1) = { "Id": 1, "Contenido": "..." }       ← objeto con Contenido como string
    # nivel 3: json.loads(Contenido) = { "Productos": [...] }              ← datos reales

    raw = response.text
    outer = json.loads(raw)           # nivel 1 → 2

    if isinstance(outer, str):
        outer = json.loads(outer)     # por si hay un nivel extra

    contenido_str = outer.get("Contenido") or outer.get("contenido")
    if not contenido_str:
        print("Estructura inesperada. Claves disponibles:", list(outer.keys()) if isinstance(outer, dict) else type(outer))
        return outer

    return json.loads(contenido_str)  # nivel 3


# ── Parseo ────────────────────────────────────────────────────────────────────

def parse_products(data: dict) -> list[dict]:
    productos_raw = data.get("Productos") or data.get("productos") or []

    if not productos_raw:
        print("No se encontró la clave 'Productos'. Claves disponibles:", list(data.keys()))
        sys.exit(1)

    print(f"{len(productos_raw)} productos encontrados en el catálogo RETO.")

    products = []
    for p in tqdm(productos_raw, desc="Parseando productos"):
        datos = p.get("DATOSPRODUCTO") or p.get("datosproducto") or p
        usos  = p.get("USOS") or p.get("usos") or []

        num_reg    = str(datos.get("Num_Registro") or datos.get("num_registro") or "").strip()
        nombre     = str(datos.get("Nombre") or datos.get("nombre") or "").strip()
        formulado  = str(datos.get("Formulado") or datos.get("formulado") or "").strip()
        titular    = str(datos.get("Titular") or datos.get("titular") or "").strip()
        fecha_cadu = str(datos.get("Fecha_Caducidad") or datos.get("fecha_caducidad") or "").strip()
        estado     = str(datos.get("Estado") or datos.get("estado") or "").strip()

        if not num_reg:
            continue

        cultivos_set: set[str] = set()
        plagas_set:   set[str] = set()
        dosis_min = dosis_max = unidad = ""

        for uso in usos:
            c  = str(uso.get("Cultivo") or "").strip()
            pl = str(uso.get("Agente")  or "").strip()   # campo real del MAPA
            dm = str(uso.get("Dosis_Min") or "").strip()
            dM = str(uso.get("Dosis_Max") or "").strip()
            ud = str(uso.get("Unidad Medida dosis") or "").strip()  # clave con espacios

            if c:  cultivos_set.add(c)
            if pl: plagas_set.add(pl)
            if dm and not dosis_min: dosis_min = dm
            if dM and not dosis_max: dosis_max = dM
            if ud and not unidad:    unidad = ud

        products.append({
            "num_reg":       num_reg,
            "nombre":        nombre,
            "principio_act": formulado,
            "titular":       titular,
            "fecha_cadu":    fecha_cadu,
            "cultivos_autori": "; ".join(sorted(cultivos_set)),
            "plagas":        "; ".join(sorted(plagas_set)),
            "dosis_min":     dosis_min,
            "dosis_max":     dosis_max,
            "unidad_dosis":  unidad,
            "activo":        "1" if estado.lower() == "vigente" else "0",
        })

    return products


# ── CSV ───────────────────────────────────────────────────────────────────────

def write_csv(products: list[dict]):
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(products)
    print(f"\nCSV escrito: {OUTPUT_CSV}  ({len(products)} productos)")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inspect", action="store_true",
                        help="Muestra las primeras claves del JSON para depuración")
    args = parser.parse_args()

    data = download_json()

    if args.inspect:
        print("\n— Claves raíz:", list(data.keys()))
        productos = data.get("Productos") or []
        if productos:
            print("— Claves de un producto:", list(productos[0].keys()))
            datos = productos[0].get("DATOSPRODUCTO") or {}
            print("— Claves DATOSPRODUCTO:", list(datos.keys()))
            usos = productos[0].get("USOS") or []
            if usos:
                print("— Claves de un USO:", list(usos[0].keys()))
        return

    products = parse_products(data)
    if not products:
        sys.exit("No se extrajo ningún producto.")

    write_csv(products)
    print("Scraping completado.")


if __name__ == "__main__":
    main()
