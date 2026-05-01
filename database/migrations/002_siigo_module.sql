-- =============================================================
-- DAVAL — Módulo SIIGO (idempotente)
-- siigo_settings   : configuración + cache de token + última sync (singleton, id=1)
-- siigo_sync_logs  : historial de ejecuciones
-- =============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS siigo_settings (
  id                   INT          PRIMARY KEY DEFAULT 1,
  partner_id           VARCHAR(120),
  username             VARCHAR(255),
  access_key           TEXT,                 -- ⚠ sensible: idealmente vía Secret Manager.
  base_url             TEXT         NOT NULL DEFAULT 'https://api.siigo.com',

  -- Cache del token de SIIGO
  cached_token         TEXT,
  cached_token_expires TIMESTAMPTZ,

  -- Estado de la última sincronización
  last_sync_started_at TIMESTAMPTZ,
  last_sync_finished_at TIMESTAMPTZ,
  last_sync_status     VARCHAR(20),          -- 'success' | 'error' | 'running'
  last_sync_count      INT          NOT NULL DEFAULT 0,
  last_sync_error      TEXT,

  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CHECK (id = 1)
);

INSERT INTO siigo_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS siigo_sync_logs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind            VARCHAR(20) NOT NULL,     -- 'products' | 'quotation_push'
  status          VARCHAR(20) NOT NULL,     -- 'success' | 'error' | 'running'
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  items_processed INT         NOT NULL DEFAULT 0,
  items_created   INT         NOT NULL DEFAULT 0,
  items_updated   INT         NOT NULL DEFAULT 0,
  error_message   TEXT,
  triggered_by    UUID        REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_siigo_logs_kind_started ON siigo_sync_logs(kind, started_at DESC);

COMMIT;
