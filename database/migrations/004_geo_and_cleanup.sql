-- =============================================================
-- DAVAL — Migration 004 (IDEMPOTENT)
-- Geo columns on company_branches + misc hardening
-- =============================================================

BEGIN;

-- Geo columns for company_branches (geolocalización y Maps)
ALTER TABLE company_branches ADD COLUMN IF NOT EXISTS latitude        NUMERIC(10,7);
ALTER TABLE company_branches ADD COLUMN IF NOT EXISTS longitude       NUMERIC(10,7);
ALTER TABLE company_branches ADD COLUMN IF NOT EXISTS address_formatted TEXT;
ALTER TABLE company_branches ADD COLUMN IF NOT EXISTS geocoded_at     TIMESTAMPTZ;

-- Spatial index for geo queries
CREATE INDEX IF NOT EXISTS idx_branches_geo
  ON company_branches(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Ensure quotation_status enum has all required values
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='pending'
    AND enumtypid=(SELECT oid FROM pg_type WHERE typname='quotation_status'))
  THEN
    ALTER TYPE quotation_status ADD VALUE IF NOT EXISTS 'pending';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='sent_to_siigo'
    AND enumtypid=(SELECT oid FROM pg_type WHERE typname='quotation_status'))
  THEN
    ALTER TYPE quotation_status ADD VALUE IF NOT EXISTS 'sent_to_siigo';
  END IF;
END $$;

-- FK index: clients → company_branches (missing)
CREATE INDEX IF NOT EXISTS idx_clients_branch
  ON users(branch_id) WHERE branch_id IS NOT NULL;

-- description column on products (missing from original schema)
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;

COMMIT;
