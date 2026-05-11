-- =============================================================
-- DAVAL — Migración 003: Índices de rendimiento faltantes
-- Problema 1: FK sin índice en promotion_clients(client_id)
-- Problema 2: JOIN lento en product_price_lists (sin compuesto)
-- Problema 3: Búsqueda ILIKE en sku sin trigrama
-- Problema 4: FK sin índice en quotation_comments(author_id)
-- Problema 5: FK sin índice en siigo_sync_logs(triggered_by)
-- Requiere: extensión pg_trgm (agregada aquí si no existe)
-- =============================================================

BEGIN;

-- Extensión de trigramas (necesaria para GIN ILIKE en sku y name)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. promotion_clients: FK client_id no está indexado.
--    La query de resolvePrices filtra por pc.client_id = $2 — sin índice
--    hace Seq Scan sobre toda la tabla por cada resolución de precio.
CREATE INDEX IF NOT EXISTS idx_promo_clients_client
  ON promotion_clients(client_id);

-- 2. product_price_lists: el JOIN en resolvePrices usa
--    ppl.product_id = p.id AND ppl.price_list_id = $2
--    El UNIQUE existente es (product_id, price_list_name), no cubre price_list_id.
--    Un índice compuesto permite Index Only Scan con INCLUDE del precio.
CREATE INDEX IF NOT EXISTS idx_ppl_product_list
  ON product_price_lists(product_id, price_list_id)
  INCLUDE (price);

-- 3. Búsqueda trigrama en sku para soportar ILIKE '%...%' sin Seq Scan.
--    name ya tiene idx_products_name_trgm; sku no lo tenía.
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm
  ON products USING GIN (sku gin_trgm_ops);

-- 4. quotation_comments: author_id es FK referenciando users(id).
--    PostgreSQL NO crea índice automático en columnas FK.
CREATE INDEX IF NOT EXISTS idx_comments_author
  ON quotation_comments(author_id)
  WHERE author_id IS NOT NULL;

-- 5. siigo_sync_logs: triggered_by es FK referenciando users(id).
CREATE INDEX IF NOT EXISTS idx_siigo_logs_triggered_by
  ON siigo_sync_logs(triggered_by)
  WHERE triggered_by IS NOT NULL;

-- 6. Índice parcial en quotations(status, created_at) para listados
--    filtrados por status activos (draft/sent) — los más frecuentes en operación.
CREATE INDEX IF NOT EXISTS idx_quotations_open_status
  ON quotations(status, created_at DESC)
  WHERE status IN ('draft', 'sent');

COMMIT;
