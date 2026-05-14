-- Auditoría de envíos de cotizaciones internas a SIIGO.
-- Permite idempotencia (un único éxito por cotización), historial de intentos y retries.

CREATE TABLE siigo_quote_integrations (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  internal_quote_id UUID        NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  siigo_quote_id    TEXT,                         -- ID asignado por SIIGO al aceptar
  request_payload   JSONB,                        -- Payload enviado (para debug/retry)
  response_payload  JSONB,                        -- Respuesta completa de SIIGO
  status            TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'success', 'error')),
  error_message     TEXT,
  attempt_count     INTEGER     NOT NULL DEFAULT 1,
  triggered_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantiza que solo haya UNA integración exitosa por cotización interna.
-- El /retry crea un nuevo registro, pero si ya existe uno 'success' no puede haber otro.
CREATE UNIQUE INDEX uq_siigo_quote_success
  ON siigo_quote_integrations(internal_quote_id)
  WHERE status = 'success';

CREATE INDEX idx_siigo_quote_int_quote
  ON siigo_quote_integrations(internal_quote_id);

CREATE INDEX idx_siigo_quote_int_status
  ON siigo_quote_integrations(status);
