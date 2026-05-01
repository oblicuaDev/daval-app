-- =============================================================
-- DAVAL APP — Migración principal (idempotente)
-- Ejecutar contra daval_db_dev:
--   psql -U daval_dev -d daval_db_dev -f infra/migrate.sql
-- =============================================================

BEGIN;

-- ---------------------------------------------------------------
-- EXTENSIONES
-- ---------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------
-- TIPOS ENUMERADOS
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'advisor', 'client');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE quotation_status AS ENUM (
    'draft',
    'sent',
    'approved',
    'rejected',
    'synced'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------
-- CATEGORÍAS
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- USUARIOS  (Admins, Asesores y usuarios de autogestión de clientes)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL,
  active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique') THEN
    ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- ---------------------------------------------------------------
-- RUTAS COMERCIALES
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS routes (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  advisor_id  UUID,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE routes
  DROP CONSTRAINT IF EXISTS routes_advisor_id_fkey;
ALTER TABLE routes
  ADD CONSTRAINT routes_advisor_id_fkey
  FOREIGN KEY (advisor_id) REFERENCES users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------
-- CLIENTES  (Empresas B2B — entidad distinta al usuario de login)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clients (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200) NOT NULL,
  nit             VARCHAR(20)  NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(30),
  user_id         UUID,
  advisor_id      UUID,
  route_id        UUID,
  siigo_client_id VARCHAR(100),
  active          BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_nit_unique') THEN
    ALTER TABLE clients ADD CONSTRAINT clients_nit_unique UNIQUE (nit);
  END IF;
END $$;

ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_user_id_fkey;
ALTER TABLE clients
  ADD CONSTRAINT clients_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_advisor_id_fkey;
ALTER TABLE clients
  ADD CONSTRAINT clients_advisor_id_fkey
  FOREIGN KEY (advisor_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_route_id_fkey;
ALTER TABLE clients
  ADD CONSTRAINT clients_route_id_fkey
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------
-- PRODUCTOS  (Catálogo Daval + datos sincronizados de SIIGO)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
  id           UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  siigo_id     VARCHAR(100),
  sku          VARCHAR(100)   NOT NULL,
  name         VARCHAR(255)   NOT NULL,
  category_id  UUID,
  unit         VARCHAR(50),
  stock        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quality      VARCHAR(50),
  image_url    TEXT,
  active       BOOLEAN        NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_siigo_id_unique') THEN
    ALTER TABLE products ADD CONSTRAINT products_siigo_id_unique UNIQUE (siigo_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_unique') THEN
    ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
  END IF;
END $$;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE products
  ADD CONSTRAINT products_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------
-- LISTAS DE PRECIOS POR PRODUCTO  (priceListPrices — datos de SIIGO)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_price_lists (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID           NOT NULL,
  price_list_name VARCHAR(100)   NOT NULL,
  price           NUMERIC(14, 2) NOT NULL,
  currency        CHAR(3)        NOT NULL DEFAULT 'COP',
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ppl_price_positive') THEN
    ALTER TABLE product_price_lists ADD CONSTRAINT ppl_price_positive CHECK (price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ppl_product_list_unique') THEN
    ALTER TABLE product_price_lists ADD CONSTRAINT ppl_product_list_unique UNIQUE (product_id, price_list_name);
  END IF;
END $$;

ALTER TABLE product_price_lists
  DROP CONSTRAINT IF EXISTS ppl_product_id_fkey;
ALTER TABLE product_price_lists
  ADD CONSTRAINT ppl_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------
-- PRODUCTOS COMPLEMENTARIOS  (N:M auto-referencial)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS complementary_products (
  product_id               UUID NOT NULL,
  complementary_product_id UUID NOT NULL,
  PRIMARY KEY (product_id, complementary_product_id)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_self_complement') THEN
    ALTER TABLE complementary_products
      ADD CONSTRAINT no_self_complement CHECK (product_id <> complementary_product_id);
  END IF;
END $$;

ALTER TABLE complementary_products
  DROP CONSTRAINT IF EXISTS cp_product_id_fkey;
ALTER TABLE complementary_products
  ADD CONSTRAINT cp_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE complementary_products
  DROP CONSTRAINT IF EXISTS cp_complementary_id_fkey;
ALTER TABLE complementary_products
  ADD CONSTRAINT cp_complementary_id_fkey
  FOREIGN KEY (complementary_product_id) REFERENCES products(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------
-- COTIZACIONES
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS quotations (
  id                 UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id          UUID             NOT NULL,
  advisor_id         UUID,
  status             quotation_status NOT NULL DEFAULT 'draft',
  siigo_quotation_id VARCHAR(100),
  notes              TEXT,
  total              NUMERIC(16, 2)   NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

ALTER TABLE quotations
  DROP CONSTRAINT IF EXISTS quotations_client_id_fkey;
ALTER TABLE quotations
  ADD CONSTRAINT quotations_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE quotations
  DROP CONSTRAINT IF EXISTS quotations_advisor_id_fkey;
ALTER TABLE quotations
  ADD CONSTRAINT quotations_advisor_id_fkey
  FOREIGN KEY (advisor_id) REFERENCES users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------
-- ÍTEMS DE COTIZACIÓN
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS quotation_items (
  id           UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID           NOT NULL,
  product_id   UUID           NOT NULL,
  quantity     NUMERIC(12, 2) NOT NULL,
  price_type   VARCHAR(100)   NOT NULL,
  unit_price   NUMERIC(14, 2) NOT NULL,
  subtotal     NUMERIC(16, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qi_quantity_positive') THEN
    ALTER TABLE quotation_items ADD CONSTRAINT qi_quantity_positive CHECK (quantity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qi_unit_price_positive') THEN
    ALTER TABLE quotation_items ADD CONSTRAINT qi_unit_price_positive CHECK (unit_price >= 0);
  END IF;
END $$;

ALTER TABLE quotation_items
  DROP CONSTRAINT IF EXISTS qi_quotation_id_fkey;
ALTER TABLE quotation_items
  ADD CONSTRAINT qi_quotation_id_fkey
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE;

ALTER TABLE quotation_items
  DROP CONSTRAINT IF EXISTS qi_product_id_fkey;
ALTER TABLE quotation_items
  ADD CONSTRAINT qi_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------
-- ÍNDICES
-- ---------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active      ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_siigo_id    ON products(siigo_id) WHERE siigo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_quality     ON products(quality);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm   ON products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_advisor      ON clients(advisor_id);
CREATE INDEX IF NOT EXISTS idx_clients_route        ON clients(route_id);
CREATE INDEX IF NOT EXISTS idx_clients_user         ON clients(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_client    ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_advisor   ON quotations(advisor_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status    ON quotations(status);

CREATE INDEX IF NOT EXISTS idx_qi_quotation         ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_qi_product           ON quotation_items(product_id);

COMMIT;

-- ---------------------------------------------------------------
-- VERIFICACIÓN
-- ---------------------------------------------------------------

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name
     AND c.table_schema = 'public') AS columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
