-- =============================================================
-- DAVAL — Migración 010: Correcciones de sincronización SIIGO y subtotales
-- =============================================================

BEGIN;

-- Fix 1: UNIQUE INDEX en (product_id, price_list_name) requerido por el
-- ON CONFLICT del upsert en siigoSync.js. Sin este índice el INSERT falla
-- con "there is no unique or exclusion constraint matching ON CONFLICT".
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ppl_product_price_list_name
  ON product_price_lists(product_id, price_list_name);

-- Fix 2: subtotal en quotation_items — si la columna existe como regular (nullable)
-- la rellenamos con quantity * unit_price y añadimos DEFAULT para futuros inserts.
-- Si ya es GENERATED, el bloque DO no hace nada.
DO $$
DECLARE
  col_gen TEXT;
BEGIN
  SELECT is_generated INTO col_gen
  FROM information_schema.columns
  WHERE table_name = 'quotation_items' AND column_name = 'subtotal';

  IF col_gen IS NULL THEN
    -- La columna no existe: crearla como columna regular con default calculado
    ALTER TABLE quotation_items
      ADD COLUMN IF NOT EXISTS subtotal NUMERIC(14,2);
    RAISE NOTICE 'Added subtotal column';
  ELSIF col_gen = 'NEVER' THEN
    -- Existe como columna regular: rellenar NULLs históricos
    UPDATE quotation_items
       SET subtotal = quantity * unit_price
     WHERE subtotal IS NULL;
    RAISE NOTICE 'Backfilled subtotal values';
  ELSE
    RAISE NOTICE 'subtotal is a generated column — no action needed';
  END IF;
END $$;

-- Fix 3: Resetear sync atascado al arrancar la migración
-- Si el servidor se cayó con last_sync_status='running', los futuros syncs
-- quedarían bloqueados para siempre. Esto lo resetea a 'error'.
UPDATE siigo_settings
   SET last_sync_status = 'error',
       last_sync_error = 'Reset by migration 010 — previous run interrupted',
       last_sync_finished_at = COALESCE(last_sync_finished_at, NOW()),
       updated_at = NOW()
 WHERE last_sync_status = 'running';

-- También cerrar logs de sync abiertos (proceso que nunca terminó)
UPDATE siigo_sync_logs
   SET status = 'error',
       finished_at = COALESCE(finished_at, NOW()),
       error_message = 'Interrupted — reset by migration 010'
 WHERE status = 'running';

COMMIT;
