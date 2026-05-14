-- =============================================================
-- DAVAL — Sincronización bidireccional de clientes con SIIGO
-- Agrega trazabilidad SIIGO a companies + tabla de auditoría
-- =============================================================

BEGIN;

-- ─── Campos SIIGO en companies ────────────────────────────────────────────────

ALTER TABLE companies ADD COLUMN IF NOT EXISTS siigo_customer_id  VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS siigo_sync_status  VARCHAR(20) NOT NULL DEFAULT 'local'
  CHECK (siigo_sync_status IN ('local', 'pending', 'synced', 'error'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS siigo_last_sync_at    TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS siigo_last_import_at  TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS siigo_last_error       TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS siigo_origin           VARCHAR(20) NOT NULL DEFAULT 'local'
  CHECK (siigo_origin IN ('local', 'siigo', 'bidirectional'));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_companies_siigo_customer_id
  ON companies(siigo_customer_id)
  WHERE siigo_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_siigo_status
  ON companies(siigo_sync_status);

-- ─── Auditoría de integraciones de clientes ───────────────────────────────────

CREATE TABLE IF NOT EXISTS siigo_customer_integrations (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID        REFERENCES companies(id) ON DELETE SET NULL,
  siigo_customer_id VARCHAR(100),
  operation         VARCHAR(20) NOT NULL
    CHECK (operation IN ('import', 'export', 'update', 'retry')),
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'error')),
  request_payload   JSONB,
  response_payload  JSONB,
  error_message     TEXT,
  duration_ms       INTEGER,
  triggered_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sci_company    ON siigo_customer_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_sci_status     ON siigo_customer_integrations(status);
CREATE INDEX IF NOT EXISTS idx_sci_operation  ON siigo_customer_integrations(operation);
CREATE INDEX IF NOT EXISTS idx_sci_siigo_id   ON siigo_customer_integrations(siigo_customer_id);
CREATE INDEX IF NOT EXISTS idx_sci_created    ON siigo_customer_integrations(created_at DESC);

COMMIT;
