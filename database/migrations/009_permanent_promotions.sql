-- =============================================================
-- DAVAL — Migración 009: Promociones permanentes y eventuales
-- Hace ends_at nullable para soportar promociones sin fecha fin
-- =============================================================

BEGIN;

-- 1) Hacer ends_at nullable (promociones permanentes no tienen fecha de fin)
ALTER TABLE promotions ALTER COLUMN ends_at DROP NOT NULL;

-- 2) Eliminar el CHECK existente (ends_at > starts_at) que bloquea NULL
--    El nombre del constraint es generado automáticamente por PG; buscamos por definición
DO $$
DECLARE
  c_name TEXT;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'promotions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%ends_at > starts_at%';

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE promotions DROP CONSTRAINT %I', c_name);
    RAISE NOTICE 'Dropped constraint: %', c_name;
  END IF;
END $$;

-- 3) Agregar nuevo CHECK que permite ends_at NULL (permanentes)
ALTER TABLE promotions ADD CONSTRAINT promotions_ends_after_starts
  CHECK (ends_at IS NULL OR ends_at > starts_at);

-- 4) Columna kind para distinguir tipo de promoción de forma explícita
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS kind VARCHAR(20) NOT NULL DEFAULT 'eventual'
  CHECK (kind IN ('permanent', 'eventual'));

-- 5) Backfill: marcar permanentes las que ya no tienen ends_at (no debería haber ninguna)
UPDATE promotions SET kind = 'permanent' WHERE ends_at IS NULL AND kind = 'eventual';

-- 6) Actualizar índice de ventana activa para incluir kind
DROP INDEX IF EXISTS idx_promotions_active_window;
CREATE INDEX IF NOT EXISTS idx_promotions_active_window
  ON promotions(active, kind, starts_at, ends_at);

COMMIT;
