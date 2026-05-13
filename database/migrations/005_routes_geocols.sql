-- =============================================================
-- DAVAL — Migration 005 (IDEMPOTENT)
-- Columnas geo-nominales para routes (mapZone, calles, carreras)
-- =============================================================

BEGIN;

ALTER TABLE routes ADD COLUMN IF NOT EXISTS map_zone     VARCHAR(200);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS street_from  VARCHAR(200);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS street_to    VARCHAR(200);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS carrera_from VARCHAR(200);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS carrera_to   VARCHAR(200);

COMMIT;
