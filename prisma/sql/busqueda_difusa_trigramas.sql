-- Búsqueda difusa por nombres (trigramas) para detectar posibles duplicados
-- de personas SIN documento (la guía oficial permite esto como mejora
-- opcional: "advertir posibles coincidencias mediante nombres...").
-- No representable declarativamente en schema.prisma (extensión + índice GIN),
-- por eso se aplica con SQL crudo vía `prisma db execute`.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS beneficiario_nombres_trgm_idx
ON "Beneficiario" USING GIN (nombres gin_trgm_ops);
