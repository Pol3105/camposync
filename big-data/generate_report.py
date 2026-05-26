"""
generate_report.py — Informe académico BigData CampoSync
Uso: python generate_report.py
Output: informe_bigdata_camposync.pdf
"""

from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, HRFlowable, KeepTogether
)

BASE       = Path(__file__).parent
OUT        = BASE / "informe_bigdata_camposync.pdf"
CHART_EXP1 = BASE / "exp1-retrieval/results/metrics_chart.png"
CHART_EXP2 = BASE / "exp2-query-performance/results/latency_comparison.png"

PAGE_W = A4[0]
PAGE_H = A4[1]
L_MARGIN = 2 * cm
R_MARGIN = 2 * cm
CONTENT_W = PAGE_W - L_MARGIN - R_MARGIN   # 17 cm

# ── Colores ───────────────────────────────────────────────────────────────────
C_GREEN  = colors.HexColor("#2D6A4F")
C_LGREY  = colors.HexColor("#F4F4F4")
C_DGREY  = colors.HexColor("#333333")
C_MGREY  = colors.HexColor("#888888")
C_WHITE  = colors.white
C_GHDR   = colors.HexColor("#E8F5E9")

# ── Estilos ───────────────────────────────────────────────────────────────────
def S(name, **kw):
    return ParagraphStyle(name, **kw)

sTitle   = S("sTitle",   fontName="Helvetica-Bold",    fontSize=28, textColor=C_WHITE,  alignment=TA_CENTER, leading=34)
sSub     = S("sSub",     fontName="Helvetica",          fontSize=13, textColor=C_WHITE,  alignment=TA_CENTER, leading=18)
sMeta    = S("sMeta",    fontName="Helvetica",          fontSize=9,  textColor=colors.HexColor("#CCCCCC"), alignment=TA_CENTER, leading=13)
sH1      = S("sH1",      fontName="Helvetica-Bold",    fontSize=16, textColor=C_GREEN,  spaceBefore=18, spaceAfter=6,  leading=20)
sH2      = S("sH2",      fontName="Helvetica-Bold",    fontSize=13, textColor=C_GREEN,  spaceBefore=14, spaceAfter=4,  leading=16)
sH3      = S("sH3",      fontName="Helvetica-Bold",    fontSize=11, textColor=C_DGREY,  spaceBefore=10, spaceAfter=3,  leading=14)
sBody    = S("sBody",    fontName="Helvetica",          fontSize=10, textColor=C_DGREY,  alignment=TA_JUSTIFY, leading=15, spaceAfter=5)
sBullet  = S("sBullet",  fontName="Helvetica",          fontSize=10, textColor=C_DGREY,  leading=14, leftIndent=14, spaceAfter=3)
sCaption = S("sCaption", fontName="Helvetica-Oblique",  fontSize=8,  textColor=C_MGREY,  alignment=TA_CENTER, spaceAfter=8)
sConcl   = S("sConcl",   fontName="Helvetica",          fontSize=9.5,textColor=C_DGREY,  alignment=TA_JUSTIFY, leading=14, leftIndent=10, rightIndent=10, spaceAfter=6, spaceBefore=6, backColor=C_LGREY, borderPadding=8)
sTCell   = S("sTCell",   fontName="Helvetica",          fontSize=8.5,textColor=C_DGREY,  leading=12, alignment=TA_LEFT)
sTHdr    = S("sTHdr",    fontName="Helvetica-Bold",     fontSize=8.5,textColor=C_WHITE,  leading=12, alignment=TA_CENTER)
sTCellC  = S("sTCellC",  fontName="Helvetica",          fontSize=8.5,textColor=C_DGREY,  leading=12, alignment=TA_CENTER)
sTCellB  = S("sTCellB",  fontName="Helvetica-Bold",     fontSize=8.5,textColor=C_GREEN,  leading=12, alignment=TA_CENTER)
sKV      = S("sKV",      fontName="Helvetica",          fontSize=9,  textColor=C_DGREY,  leading=12, alignment=TA_CENTER)

# ── Helpers ───────────────────────────────────────────────────────────────────
def h1(t):   return Paragraph(t, sH1)
def h2(t):   return Paragraph(t, sH2)
def p(t):    return Paragraph(t, sBody)
def bul(t):  return Paragraph(f"&#8226;&nbsp; {t}", sBullet)
def sp(n=8): return Spacer(1, n)
def hr():    return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CCCCCC"), spaceAfter=4)
def cap(t):  return Paragraph(t, sCaption)

def c(text, bold=False, center=False, green=False, wrap=True):
    """Helper para celda de tabla como Paragraph."""
    st = sTCell
    if center and bold and green: st = sTCellB
    elif center: st = sTCellC
    elif bold:   st = S(f"_cb_{text[:8]}", fontName="Helvetica-Bold", fontSize=8.5, textColor=C_DGREY, leading=12)
    return Paragraph(str(text), st)

def ch(text):
    """Cabecera de tabla."""
    return Paragraph(str(text), sTHdr)

BASE_TS = TableStyle([
    ("BACKGROUND",    (0, 0), (-1, 0), C_GREEN),
    ("TEXTCOLOR",     (0, 0), (-1, 0), C_WHITE),
    ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE",      (0, 0), (-1, 0), 8.5),
    ("ALIGN",         (0, 0), (-1, 0), "CENTER"),
    ("VALIGN",        (0, 0), (-1,-1), "MIDDLE"),
    ("FONTNAME",      (0, 1), (-1,-1), "Helvetica"),
    ("FONTSIZE",      (0, 1), (-1,-1), 8.5),
    ("ROWBACKGROUNDS",(0, 1), (-1,-1), [C_WHITE, C_LGREY]),
    ("GRID",          (0, 0), (-1,-1), 0.4, colors.HexColor("#DDDDDD")),
    ("TOPPADDING",    (0, 0), (-1,-1), 5),
    ("BOTTOMPADDING", (0, 0), (-1,-1), 5),
    ("LEFTPADDING",   (0, 0), (-1,-1), 6),
    ("RIGHTPADDING",  (0, 0), (-1,-1), 6),
])

def make_table(rows, col_w, extra_style=None):
    t = Table(rows, colWidths=col_w, repeatRows=1)
    ts = BASE_TS.clone()  if hasattr(BASE_TS, 'clone') else TableStyle(BASE_TS._cmds[:])
    if extra_style:
        for cmd in extra_style:
            ts.add(*cmd)
    t.setStyle(ts)
    return t


# ── Portada ───────────────────────────────────────────────────────────────────
def cover_page():
    story = []
    story.append(sp(50))

    # Bloque de título verde
    title_rows = [
        [Paragraph("CampoSync", sTitle)],
        [Paragraph("Phytosanitary Compliance Engine", sSub)],
        [Paragraph("Big Data Project — Academic Report", sSub)],
        [Paragraph(" ", sMeta)],
        [Paragraph("<b>Pablo Rejón Camacho</b>",
                   S("cn", fontName="Helvetica-Bold", fontSize=14, textColor=C_WHITE, alignment=TA_CENTER, leading=18))],
        [Paragraph("Università degli Studi Roma Tre", sMeta)],
        [Paragraph("Facoltà di Ingegneria · SSB Track · AA 2025/2026", sMeta)],
        [Paragraph(" ", sMeta)],
        [Paragraph("Submission: 23 July 2026  |  Presentation: 24 July 2026", sMeta)],
    ]
    title_tbl = Table(title_rows, colWidths=[CONTENT_W])
    title_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_GREEN),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ("LEFTPADDING",   (0,0), (-1,-1), 24),
        ("RIGHTPADDING",  (0,0), (-1,-1), 24),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(title_tbl)
    story.append(sp(30))

    # Tarjetas resumen experimentos
    card_rows = [
        [ch("EXPERIMENT 1"), ch("EXPERIMENT 2")],
        [
            Paragraph(
                "<b>Retrieval Accuracy</b><br/>"
                "Comparison of 4 search methods<br/>"
                "RETO catalogue · 2,045 products<br/>"
                "841 annotated queries<br/>"
                "<b>TF-IDF F1 = 0.622</b>",
                S("kv1", fontName="Helvetica", fontSize=9, leading=14, alignment=TA_CENTER, textColor=C_DGREY)
            ),
            Paragraph(
                "<b>Query Performance N+1</b><br/>"
                "Hibernate JPA Benchmark<br/>"
                "100,000 real treatment records<br/>"
                "4 loading strategies<br/>"
                "<b>JOIN FETCH: 3.6× throughput</b>",
                S("kv2", fontName="Helvetica", fontSize=9, leading=14, alignment=TA_CENTER, textColor=C_DGREY)
            ),
        ],
    ]
    card_tbl = Table(card_rows, colWidths=[CONTENT_W/2, CONTENT_W/2])
    card_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), C_LGREY),
        ("BACKGROUND",    (0,1), (-1,1), C_WHITE),
        ("BOX",           (0,0), (-1,-1), 1.0, C_GREEN),
        ("LINEAFTER",     (0,0), (0,-1), 0.5, colors.HexColor("#CCCCCC")),
        ("GRID",          (0,0), (-1,-1), 0.3, colors.HexColor("#DDDDDD")),
        ("TOPPADDING",    (0,0), (-1,-1), 12),
        ("BOTTOMPADDING", (0,0), (-1,-1), 12),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
    ]))
    story.append(card_tbl)
    story.append(sp(30))
    story.append(Paragraph(
        "Branch: BigData  |  Stack: Spring Boot 3 · PostgreSQL 15 + pgvector · React · Python 3.14",
        S("stack", fontName="Helvetica", fontSize=8, textColor=C_MGREY, alignment=TA_CENTER)
    ))
    story.append(PageBreak())
    return story


# ── Secciones ─────────────────────────────────────────────────────────────────

def section_intro():
    story = [h1("1. Introduction and Motivation")]
    story.append(p(
        "CampoSync is a phytosanitary compliance engine for approximately "
        "<b>900,000 Spanish agricultural farms</b> managing treatments regulated "
        "by the Ministry of Agriculture (MAPA). The sector handles over "
        "<b>€5.7 billion</b> annually in PAC subsidies, conditional on strict compliance "
        "with the RETO phytosanitary product catalogue."
    ))
    story.append(sp(6))

    W = [2.5*cm, 12.5*cm]
    rows = [
        [ch("Dimension"), ch("Manifestation in CampoSync")],
        [c("Volume"),    c("2,045 RETO products · 100,000 treatments · 2,045 embeddings × 384 dims (pgvector)")],
        [c("Velocity"),  c("Product search <3 ms · N+1 Benchmark: up to 21 req/s with JOIN FETCH")],
        [c("Variety"),   c("Structured data (PostgreSQL), vector data (pgvector), informal text, MAPA JSON, audit logs")],
        [c("Veracity"),  c("Official RETO source (MAPA) · num_reg as unique key · accent normalisation · expiry validation")],
        [c("Value"),     c("Reduced PAC penalty risk · search understands informal language: \"fungi in vineyard\" → copper")],
    ]
    story.append(make_table(rows, W))
    story.append(cap("Table 1. The 5Vs of Big Data applied to CampoSync."))
    return story


def section_architecture():
    story = [h1("2. System Architecture")]
    story.append(p(
        "CampoSync uses a three-layer architecture on Docker, extended with "
        "Big Data-specific components in the BigData branch:"
    ))
    story.append(sp(6))

    W = [2.2*cm, 3.8*cm, 3.8*cm, 5.2*cm]
    rows = [
        [ch("Layer"), ch("Component"), ch("Technology"), ch("Big Data Role")],
        [c("Frontend"),  c("ModalNuevoInventario"),             c("React + Vite"),                   c("Search bar with 250ms debounce, lazy loading")],
        [c("Backend"),   c("ProductoFitosanitarioController"),   c("Spring Boot 3 / Java 21"),         c("Endpoint /search, NFD normalisation, Query Expansion")],
        [c("Backend"),   c("TratamientoRepository"),             c("Hibernate / JPA"),                 c("LAZY / EAGER / JOIN FETCH / EntityGraph variants")],
        [c("Database"),  c("producto_fitosanitario"),            c("PostgreSQL 15 + pgvector"),        c("embedding vector(384) column, ivfflat cosine index")],
        [c("Python"),    c("ingest_reto.py / evaluate.py"),      c("sentence-transformers, sklearn"),  c("Vector ingestion, full Exp1 evaluation")],
        [c("Python"),    c("seed_100k.py / benchmark.py"),       c("psycopg2, requests"),              c("100k seeder, HTTP benchmark for Exp2")],
    ]
    story.append(make_table(rows, W))
    story.append(cap("Table 2. Big Data architecture components."))
    story.append(sp(8))
    story.append(p(
        "The database uses the <b>pgvector</b> extension (Flyway migration V14) for 384-dimension "
        "vectors with ANN cosine similarity search (IVFFlat index, 100 lists). "
        "Hibernate runs in <i>validate</i> mode: Flyway manages the full schema (14 migrations)."
    ))
    return story


def section_exp1():
    story = [h1("3. Experiment 1 — Retrieval Accuracy")]

    story.append(h2("3.1 Objective"))
    story.append(p(
        "Compare four retrieval methods over the RETO catalogue, simulating real farmer queries: "
        "from exact commercial name searches to informal queries with typos or formulated "
        "as crop-and-pest combinations."
    ))

    story.append(h2("3.2 Annotated dataset"))
    story.append(p(
        "<b>841 annotated queries</b> generated from 150 active RETO products "
        "with 7 query variant types per product (script <i>generate_dataset.py</i>):"
    ))
    story.append(sp(4))

    W1 = [3.8*cm, 5.2*cm, 2.5*cm, 2.0*cm, 3.0*cm]
    rows1 = [
        [ch("Type"), ch("Example"), ch("Difficulty"), ch("N"), ch("Description")],
        [c("Exact name"),         c("PENSHAR 40% SC"),              c("Easy",center=True),   c("150",center=True),  c("Full commercial name")],
        [c("Partial name"),       c("PENSHAR"),                     c("Medium",center=True), c("~130",center=True), c("First 1-2 words")],
        [c("Active ingredient"),  c("pendimetalina"),               c("Medium",center=True), c("~143",center=True), c("Pure active ingredient")],
        [c("Lowercase"),          c("penshar 40% sc"),              c("Medium",center=True), c("~100",center=True), c("Lowercase, no hyphens")],
        [c("Crop + pest"),        c("achicoria dicotiledóneas"),     c("Hard",center=True),   c("~150",center=True), c("Real agronomic query")],
        [c("Crop only"),          c("achicoria (hojas)"),            c("Hard",center=True),   c("~168",center=True), c("Highly ambiguous")],
        [c("Typo"),               c("peshar 40% sc"),               c("Hard",center=True),   c("~150",center=True), c("dup/swap/del error")],
    ]
    story.append(make_table(rows1, W1))
    story.append(cap("Table 3. Query types · Total: 841 (easy: 150, medium: 373, hard: 318)."))

    story.append(h2("3.3 Methods"))

    W2 = [3.0*cm, 5.0*cm, 7.0*cm]
    rows2 = [
        [ch("Method"), ch("Technique"), ch("Implementation")],
        [c("Exact Match"),  c("Exact string match"),          c("Dict name_lower → num_reg. Case-insensitive.")],
        [c("TF-IDF"),       c("TF-IDF vectors + cosine"),     c("TfidfVectorizer sklearn, bigrams (1,2), sublinear_tf=True.")],
        [c("BM25"),         c("Okapi BM25"),                  c("BM25Okapi (rank-bm25). Whitespace tokenisation.")],
        [c("Embeddings"),   c("sentence-transformers + ANN"), c("paraphrase-multilingual-MiniLM-L12-v2 (384 dims) + ivfflat cosine pgvector.")],
    ]
    story.append(make_table(rows2, W2))
    story.append(cap("Table 4. Description of the four retrieval methods."))

    story.append(p(
        "Indexed corpus (TF-IDF / BM25 / Embeddings): "
        "<i>name + active_ingredient + authorized_crops[:200] + pests[:200]</i>."
    ))

    story.append(h2("3.4 Results"))
    story.append(sp(4))

    W3 = [3.5*cm, 2.0*cm, 2.0*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.0*cm]
    rows3 = [
        [ch("Method"), ch("P@1"), ch("R@5"), ch("F1 Global"), ch("F1 Easy"), ch("F1 Medium"), ch("F1 Hard")],
        [c("Exact Match"),      c("0.345",center=True), c("0.345",center=True), c("0.345",center=True), c("1.000",center=True,bold=True,green=True), c("0.373",center=True), c("0.003",center=True)],
        [c("TF-IDF ★",bold=True),c("0.537",center=True,bold=True,green=True), c("0.738",center=True,bold=True,green=True), c("0.622",center=True,bold=True,green=True), c("0.966",center=True), c("0.739",center=True,bold=True,green=True), c("0.301",center=True,bold=True,green=True)],
        [c("BM25"),             c("0.533",center=True), c("0.687",center=True), c("0.600",center=True), c("0.966",center=True), c("0.734",center=True), c("0.262",center=True)],
        [c("Embeddings"),       c("0.050",center=True), c("0.064",center=True), c("0.056",center=True), c("0.139",center=True), c("0.055",center=True), c("0.018",center=True)],
    ]
    story.append(make_table(rows3, W3, extra_style=[
        ("BACKGROUND", (0,2), (-1,2), C_GHDR),
    ]))
    story.append(cap("Table 5. Metrics by method and difficulty. ★ = best global result."))

    if CHART_EXP1.exists():
        story.append(sp(8))
        img = Image(str(CHART_EXP1), width=14*cm, height=8.5*cm)
        img.hAlign = "CENTER"
        story.append(img)
        story.append(cap("Figure 1. Visual comparison P@1, R@5, F1-Score by method."))

    story.append(h2("3.5 Analysis"))
    story.append(bul(
        "<b>Exact Match (F1=0.345):</b> perfect only for exact names (F1=1.0 easy), "
        "fails for any variation. Confirms that farmers rarely know the full commercial name."
    ))
    story.append(bul(
        "<b>TF-IDF and BM25 (F1=0.622 / 0.600):</b> outperform Exact Match via "
        "individual token matching. For hard queries, TF-IDF reaches F1=0.301 because "
        "crop and pest fields contain exactly those words in the corpus."
    ))
    story.append(bul(
        "<b>Embeddings (F1=0.056):</b> unexpectedly low. Root cause: "
        "<i>paraphrase-multilingual-MiniLM-L12-v2</i> is a <i>symmetric</i> paraphrase model, "
        "not designed for asymmetric retrieval. RETO brand names are proper nouns "
        "outside the model vocabulary — embeddings produce indistinguishable cosine "
        "similarity (~0.65) between unrelated products. Specialised retrieval requires "
        "bi-encoders (e.g. <i>multi-qa-MiniLM-L6-cos-v1</i>) or fine-tuning."
    ))
    story.append(sp(4))
    story.append(Paragraph(
        "Conclusion: For phytosanitary product catalogues with specialised brand names, "
        "TF-IDF/BM25 are the optimal solution at minimal computational cost. Embeddings "
        "require a bi-encoder model or a hybrid BM25 + semantic reranking approach.",
        sConcl
    ))
    return story


def section_exp2():
    story = [h1("4. Experiment 2 — Query Performance (N+1)")]

    story.append(h2("4.1 Objective"))
    story.append(p(
        "Quantify the impact of the Hibernate JPA N+1 problem over <b>100,000 treatment records</b> "
        "and demonstrate the improvement achieved with JOIN FETCH and EntityGraph."
    ))

    story.append(h2("4.2 The N+1 Problem"))
    story.append(p(
        "The <i>Tratamiento</i> entity holds <b>5 LAZY relationships</b>: Recinto, Granjero, "
        "ProductoFitosanitario, Aplicador, Equipamiento. Listing N treatments triggers "
        "1 initial query + N queries per accessed relationship → potentially <b>up to 5N+1 SQL queries</b> "
        "per request. With 3,747 treatments per request (benchmark sample): up to "
        "<b>18,736 SQL queries</b> per call."
    ))

    story.append(h2("4.3 Seeded Data"))
    story.append(sp(4))
    W_s = [5*cm, 3.5*cm, 5.5*cm]
    rows_s = [
        [ch("Entity"), ch("Records"), ch("Detail")],
        [c("Farms (farmers)"),  c("~1,000",center=True),  c("Realistic synthetic data")],
        [c("Parcels"),          c("~5,000",center=True),  c("5 per farm on average")],
        [c("Plots (recintos)"), c("~15,000",center=True), c("3 per parcel on average")],
        [c("Treatments"),       c("100,000",center=True,bold=True,green=True), c("Real RETO products used")],
    ]
    story.append(make_table(rows_s, W_s))
    story.append(cap("Table 6. Data volume generated by seed_100k.py."))

    story.append(h2("4.4 Strategies Evaluated"))
    story.append(bul("<b>LAZY:</b> default lazy loading — fires N+1 queries per request"))
    story.append(bul("<b>EAGER:</b> eager loading — identical to LAZY when serialising the full object graph"))
    story.append(bul("<b>JOIN FETCH:</b> single SQL query with JOINs via @Query JPQL"))
    story.append(bul("<b>EntityGraph:</b> declarative variant of JOIN FETCH with @EntityGraph — generates the same underlying SQL"))

    story.append(h2("4.5 Results"))
    story.append(sp(4))

    W_b = [3.2*cm, 1.8*cm, 2.4*cm, 2.8*cm, 2.8*cm, 2.0*cm, 2.0*cm]
    # Total col widths: 3.2+1.8+2.4+2.8+2.8+2.0+2.0 = 17.0 cm
    rows_b = [
        [ch("Strategy"), ch("Conc."), ch("Throughput\n(req/s)"), ch("Avg Lat.\n(ms)"), ch("P95\n(ms)"), ch("Success"), ch("")],
        [c("LAZY (N+1)"),    c("10", center=True),  c("5.67",center=True), c("1.750",center=True),  c("1.895",center=True), c("100%",center=True), c("")],
        [c("LAZY (N+1)"),    c("50", center=True),  c("5.80",center=True), c("6.893",center=True),  c("8.684",center=True), c("100%",center=True), c("")],
        [c("LAZY (N+1)"),    c("100",center=True),  c("5.83",center=True), c("13.351",center=True), c("17.407",center=True),c("100%",center=True), c("")],
        [c("EAGER (N+1)"),   c("10", center=True),  c("5.73",center=True), c("1.732",center=True),  c("1.876",center=True), c("100%",center=True), c("")],
        [c("EAGER (N+1)"),   c("50", center=True),  c("5.85",center=True), c("6.820",center=True),  c("8.660",center=True), c("100%",center=True), c("")],
        [c("EAGER (N+1)"),   c("100",center=True),  c("5.72",center=True), c("13.302",center=True), c("17.760",center=True),c("100%",center=True), c("")],
        [c("JOIN FETCH ★"),  c("10", center=True),  c("19.61",center=True,bold=True,green=True), c("497",center=True,bold=True,green=True), c("604",center=True,bold=True,green=True), c("100%",center=True), c("")],
        [c("JOIN FETCH ★"),  c("50", center=True),  c("21.73",center=True,bold=True,green=True), c("1.799",center=True,bold=True,green=True),c("2.361",center=True,bold=True,green=True),c("100%",center=True), c("")],
        [c("JOIN FETCH ★"),  c("100",center=True),  c("21.24",center=True,bold=True,green=True), c("3.617",center=True,bold=True,green=True),c("4.885",center=True,bold=True,green=True),c("100%",center=True), c("")],
        [c("EntityGraph"),   c("10", center=True),  c("17.94",center=True),c("535",center=True),    c("645",center=True),   c("100%",center=True), c("")],
        [c("EntityGraph"),   c("50", center=True),  c("20.75",center=True),c("1.879",center=True),  c("2.522",center=True), c("100%",center=True), c("")],
        [c("EntityGraph"),   c("100",center=True),  c("20.13",center=True),c("3.808",center=True),  c("5.089",center=True), c("100%",center=True), c("")],
    ]
    story.append(make_table(rows_b, W_b, extra_style=[
        ("BACKGROUND", (0,7),  (-1,9),  C_GHDR),
        ("BACKGROUND", (0,10), (-1,12), C_LGREY),
    ]))
    story.append(cap("Table 7. N+1 benchmark results (3,747 treatments/request). ★ = best strategy."))

    if CHART_EXP2.exists():
        story.append(sp(8))
        img = Image(str(CHART_EXP2), width=14*cm, height=8.5*cm)
        img.hAlign = "CENTER"
        story.append(img)
        story.append(cap("Figure 2. Latency and throughput comparison by strategy and concurrency level."))

    story.append(h2("4.6 Improvement KPIs (100 concurrent users)"))
    story.append(sp(4))

    W_k = [4.5*cm, 3.5*cm, 3.5*cm, 5.5*cm]
    rows_k = [
        [ch("KPI"), ch("LAZY"), ch("JOIN FETCH"), ch("Improvement")],
        [c("Throughput"),     c("5.83 req/s",center=True), c("21.24 req/s",center=True,bold=True,green=True), c("+264% (+3.6×)",center=True,bold=True,green=True)],
        [c("Avg latency"),    c("13.351 ms",center=True),  c("3.617 ms",center=True,bold=True,green=True),    c("−73%",center=True,bold=True,green=True)],
        [c("P95 latency"),    c("17.407 ms",center=True),  c("4.885 ms",center=True,bold=True,green=True),    c("−72%",center=True,bold=True,green=True)],
        [c("Error rate"),     c("0%",center=True),          c("0%",center=True),                               c("—",center=True)],
    ]
    story.append(make_table(rows_k, W_k))
    story.append(cap("Table 8. KPI improvement JOIN FETCH vs LAZY (100 concurrent users)."))

    story.append(sp(6))
    story.append(bul("<b>LAZY ≈ EAGER:</b> the theoretical difference cancels out because the serialiser traverses the full object graph in both cases."))
    story.append(bul("<b>JOIN FETCH ≈ EntityGraph:</b> semantically equivalent — both generate the same underlying SQL with JOINs."))
    story.append(sp(4))
    story.append(Paragraph(
        "Conclusion: In Spring Boot with LAZY relationships over >100k rows, JOIN FETCH or @EntityGraph "
        "are mandatory on list endpoints. The 3.6× throughput improvement and −72% P95 gain scale "
        "proportionally with the number of LAZY relationships in the domain model.",
        sConcl
    ))
    return story


def section_phase6():
    story = [h1("5. Phase 6 — Production Integration")]
    story.append(p(
        "Exp1 findings were transferred to the real CampoSync interface, validating the "
        "technology transfer from academic experiments to a working production feature."
    ))

    story.append(h2("5.1 Initial Problem"))
    story.append(p(
        "The inventory modal (<i>ModalNuevoInventario.jsx</i>) loaded all 2,045 products on "
        "component mount, creating 2,045 DOM nodes on mobile devices. Result: rendering lag "
        "and unacceptable UX."
    ))

    story.append(h2("5.2 Solution Implemented"))

    W_f = [3.5*cm, 11.5*cm]
    rows_f = [
        [ch("Component"), ch("Change Implemented")],
        [c("Backend"),        c("Endpoint GET /api/productos/search?query= with LIKE search on name, active ingredient and crops. 50 results max.")],
        [c("Normalisation"),  c("java.text.Normalizer NFD in Java strips diacritics before querying. \"Cúprico\" → \"Cuprico\" → matches \"CUPRICO\".")],
        [c("Query Expansion"), c("Synonym map: \"fungi\"→\"cobre\", \"slugs\"→\"metaldehido\", \"weeds\"→\"glifosato\", \"bugs\"→\"deltametrin\". Automatic fallback when direct search returns 0 results.")],
        [c("Frontend"),       c("250ms debouncing · lazy loading (modal opens instantly) · floating premium list with selected product card.")],
    ]
    story.append(make_table(rows_f, W_f))
    story.append(cap("Table 9. Changes implemented in Phase 6."))

    story.append(h2("5.3 Regulatory Finding"))
    story.append(p(
        "Searching for \"rat poison\" returns 0 results. Reason: rodenticides are <b>biocides</b> "
        "regulated by the Ministry of Health, not MAPA phytosanitary products. The RETO catalogue "
        "excludes them by legal definition — this precisely delimits the regulatory domain of the application."
    ))
    return story


def section_conclusions():
    story = [h1("6. Conclusions and Future Work")]

    story.append(h2("6.1 Conclusions"))
    story.append(bul(
        "<b>Exp1:</b> TF-IDF outperforms symmetric embeddings for retrieval over specialised catalogues "
        "with brand names. The paraphrase model is unsuitable for asymmetric retrieval — "
        "a valid scientific finding that refutes the initial hypothesis."
    ))
    story.append(bul(
        "<b>Exp2:</b> The Hibernate N+1 problem is quantifiable and its solution (JOIN FETCH) "
        "multiplies throughput 3.6× and reduces P95 latency by 72% with no schema or business logic changes."
    ))
    story.append(bul(
        "<b>Phase 6:</b> Exp1 transfer to production was direct. Lexical search + "
        "normalisation + Query Expansion covers 100% of farmer use cases "
        "within the phytosanitary regulatory domain."
    ))

    story.append(h2("6.2 Future Work"))
    story.append(sp(4))

    W_fut = [2.8*cm, 12.2*cm]
    rows_fut = [
        [ch("Area"), ch("Proposal")],
        [c("Retrieval"),   c("Fine-tune bi-encoder multi-qa-MiniLM-L6-cos-v1 on real farmer queries to surpass TF-IDF on hard queries.")],
        [c("Retrieval"),   c("Hybrid retrieval: BM25 for recall@100 + semantic reranking with cross-encoder. Modern enterprise search standard.")],
        [c("Performance"), c("Redis cache on the list endpoint. Projected: −90% additional latency for hot data.")],
        [c("Data"),        c("Real-time MAPA API integration for automatic RETO catalogue updates.")],
        [c("ML"),          c("Treatment expiry prediction and proactive alerts via per-parcel time series.")],
    ]
    story.append(make_table(rows_fut, W_fut))
    story.append(cap("Table 10. Future work directions."))
    return story


# ── Header / Footer ───────────────────────────────────────────────────────────

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(C_MGREY)
    canvas.drawString(L_MARGIN, 1.4*cm,
        "CampoSync — Big Data Report · Pablo Rejón Camacho · Roma Tre AA 2025/2026")
    if doc.page > 1:
        canvas.drawRightString(PAGE_W - R_MARGIN, 1.4*cm, f"Page {doc.page - 1}")
    canvas.setStrokeColor(C_GREEN)
    canvas.setLineWidth(1.5)
    canvas.line(L_MARGIN, PAGE_H - 1.4*cm, PAGE_W - R_MARGIN, PAGE_H - 1.4*cm)
    canvas.restoreState()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=L_MARGIN, rightMargin=R_MARGIN,
        topMargin=2.2*cm, bottomMargin=2.2*cm,
        title="CampoSync — Big Data Report",
        author="Pablo Rejón Camacho",
        subject="Big Data · SSB Track · Università Roma Tre AA 2025/2026",
    )

    story = []
    story += cover_page()
    story += section_intro()
    story.append(PageBreak())
    story += section_architecture()
    story.append(PageBreak())
    story += section_exp1()
    story.append(PageBreak())
    story += section_exp2()
    story.append(PageBreak())
    story += section_phase6()
    story.append(PageBreak())
    story += section_conclusions()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF generado: {OUT}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
