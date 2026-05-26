-- Fase 0.2: activar pgvector y añadir columna de embeddings al catálogo RETO
-- Modelo: paraphrase-multilingual-MiniLM-L12-v2 → vector de 384 dimensiones

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE producto_fitosanitario
    ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Índice IVFFlat para búsqueda ANN (cosine similarity)
-- lists=100 es adecuado para tablas de ~10.000 productos RETO
CREATE INDEX IF NOT EXISTS idx_producto_embedding
    ON producto_fitosanitario
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
