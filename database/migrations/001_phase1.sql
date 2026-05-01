-- =============================================================
-- DAVAL — Phase 1 migration (IDEMPOTENT, safe to re-run)
-- 6 ALTERs + 7 new tables
-- Locked rules:
--   * TZ: America/Bogota (server)
--   * Pricing: finalPrice = min(promotionPrice, priceListPrice)
--   * Price-list ownership: clients.price_list_id (NOT users)
-- =============================================================

BEGIN;

-- 1) price_lists (entity) ------------------------------------------------
CREATE TABLE IF NOT EXISTS price_lists (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    multiplier  NUMERIC(6,4) NOT NULL DEFAULT 1.0 CHECK (multiplier > 0),
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_price_lists_default
  ON price_lists(is_default) WHERE is_default = TRUE;

-- 2) companies + 3) company_branches ------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(200) NOT NULL,
    nit        VARCHAR(20)  NOT NULL UNIQUE,
    email      VARCHAR(255),
    phone      VARCHAR(30),
    address    TEXT,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_branches (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name       VARCHAR(200) NOT NULL,
    address    TEXT,
    city       VARCHAR(100),
    route_id   UUID         REFERENCES routes(id)  ON DELETE SET NULL,
    advisor_id UUID         REFERENCES users(id)   ON DELETE SET NULL,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_branches_company ON company_branches(company_id);
CREATE INDEX IF NOT EXISTS idx_branches_route   ON company_branches(route_id);
CREATE INDEX IF NOT EXISTS idx_branches_advisor ON company_branches(advisor_id);

-- 4) promotions + 5) promotion_prices + 6) promotion_clients -----------
CREATE TABLE IF NOT EXISTS promotions (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    scope       VARCHAR(20)  NOT NULL CHECK (scope IN ('all','specific')),
    starts_at   TIMESTAMPTZ  NOT NULL,
    ends_at     TIMESTAMPTZ  NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_promotions_active_window
  ON promotions(active, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS promotion_prices (
    promotion_id UUID           NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    sku          VARCHAR(100)   NOT NULL,
    price        NUMERIC(14,2)  NOT NULL CHECK (price >= 0),
    PRIMARY KEY (promotion_id, sku)
);
CREATE INDEX IF NOT EXISTS idx_promo_prices_sku ON promotion_prices(sku);

CREATE TABLE IF NOT EXISTS promotion_clients (
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    client_id    UUID NOT NULL REFERENCES clients(id)    ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, client_id)
);

-- 7) quotation_comments -------------------------------------------------
CREATE TABLE IF NOT EXISTS quotation_comments (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID         NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    author_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    text         TEXT         NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_quotation ON quotation_comments(quotation_id);

-- =============================================================
-- ALTERs (each column wrapped to be re-runnable)
-- =============================================================

-- A1) routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS day            VARCHAR(15);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS cutoff_time    TIME;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS city           VARCHAR(100);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS quadrant_id    VARCHAR(40);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS quadrant_name  VARCHAR(120);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS bounds         JSONB;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS center         JSONB;

-- A2) clients.price_list_id (locked rule)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_clients_price_list ON clients(price_list_id);

-- A3) product_price_lists.price_list_id
ALTER TABLE product_price_lists
  ADD COLUMN IF NOT EXISTS price_list_id UUID REFERENCES price_lists(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ppl_price_list ON product_price_lists(price_list_id);

-- A4) users company/branch link
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id)        ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id  UUID REFERENCES company_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_branch  ON users(branch_id);

-- A5) quotations: human code + company/branch + carrier + siigo url
CREATE SEQUENCE IF NOT EXISTS quotation_code_seq START 1;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS code       VARCHAR(20);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id)        ON DELETE SET NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS branch_id  UUID REFERENCES company_branches(id) ON DELETE SET NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS carrier    VARCHAR(120);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS siigo_url  TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotations_code_key'
  ) THEN
    ALTER TABLE quotations ADD CONSTRAINT quotations_code_key UNIQUE (code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quotations_company ON quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_branch  ON quotations(branch_id);

-- A6) products.base_price
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price NUMERIC(14,2) NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_base_price_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_base_price_check CHECK (base_price >= 0);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_products_base_price ON products(base_price);

COMMIT;
