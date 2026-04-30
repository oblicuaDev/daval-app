-- =============================================================
-- DAVAL APP — Esquema de Base de Datos PostgreSQL
-- =============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TIPOS ENUMERADOS
-- =============================================================

CREATE TYPE user_role AS ENUM ('admin', 'advisor', 'client');

CREATE TYPE quotation_status AS ENUM (
    'draft',        -- recién creada
    'sent',         -- enviada al cliente
    'approved',     -- aprobada por el cliente
    'rejected',     -- rechazada
    'synced'        -- sincronizada en SIIGO
);

-- =============================================================
-- CATEGORÍAS DE PRODUCTOS
-- =============================================================

CREATE TABLE categories (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- USUARIOS  (Admins, Asesores y Clientes con acceso de login)
-- =============================================================

CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role   NOT NULL,
    active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- RUTAS COMERCIALES
-- =============================================================

CREATE TABLE routes (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    advisor_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
    active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- CLIENTES  (Empresas B2B — entidad distinta al usuario login)
-- =============================================================

CREATE TABLE clients (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(200) NOT NULL,
    nit              VARCHAR(20)  NOT NULL UNIQUE,
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(30),
    -- Vinculación con usuario de login para autogestión de cotizaciones
    user_id          UUID        REFERENCES users(id) ON DELETE SET NULL,
    -- Asesor asignado
    advisor_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
    -- Ruta comercial asignada
    route_id         UUID        REFERENCES routes(id) ON DELETE SET NULL,
    -- ID en SIIGO para sincronización
    siigo_client_id  VARCHAR(100),
    active           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- PRODUCTOS  (Catálogo Daval + atributos sincronizados de SIIGO)
-- =============================================================

CREATE TABLE products (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- ID en SIIGO (NULL hasta que se sincronice por primera vez)
    siigo_id      VARCHAR(100) UNIQUE,
    sku           VARCHAR(100) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    category_id   UUID         REFERENCES categories(id) ON DELETE SET NULL,
    -- Unidad de medida proveniente de SIIGO (ej: 'kg', 'und', 'caja')
    unit          VARCHAR(50),
    -- Stock sincronizado desde SIIGO
    stock         NUMERIC(12, 2) NOT NULL DEFAULT 0,
    -- Atributo propio de Daval (ej: 'Alta', 'Media', 'Baja')
    quality       VARCHAR(50),
    image_url     TEXT,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Timestamp de la última sincronización exitosa con SIIGO
    last_sync_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================
-- LISTAS DE PRECIOS POR PRODUCTO  (priceListPrices — de SIIGO)
-- Un producto puede tener múltiples listas (detal, mayorista, etc.)
-- =============================================================

CREATE TABLE product_price_lists (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_list_name VARCHAR(100) NOT NULL,
    price           NUMERIC(14, 2) NOT NULL CHECK (price >= 0),
    currency        CHAR(3)      NOT NULL DEFAULT 'COP',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, price_list_name)
);

-- =============================================================
-- PRODUCTOS COMPLEMENTARIOS  (relación N:M auto-referencial)
-- =============================================================

CREATE TABLE complementary_products (
    product_id              UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    complementary_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, complementary_product_id),
    -- Un producto no puede ser complementario de sí mismo
    CONSTRAINT no_self_complement CHECK (product_id <> complementary_product_id)
);

-- =============================================================
-- COTIZACIONES
-- =============================================================

CREATE TABLE quotations (
    id                  UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id           UUID             NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    advisor_id          UUID             REFERENCES users(id) ON DELETE SET NULL,
    status              quotation_status NOT NULL DEFAULT 'draft',
    -- ID asignado por SIIGO al sincronizar
    siigo_quotation_id  VARCHAR(100),
    notes               TEXT,
    -- Total calculado y desnormalizado para consultas rápidas
    total               NUMERIC(16, 2)   NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ÍTEMS DE COTIZACIÓN
-- =============================================================

CREATE TABLE quotation_items (
    id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id  UUID           NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id    UUID           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity      NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    -- Nombre de la lista de precios aplicada (ej: 'Mayorista')
    price_type    VARCHAR(100)   NOT NULL,
    -- Precio snapshot al momento de cotizar (no depende del precio actual)
    unit_price    NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
    -- Columna generada: subtotal = quantity * unit_price
    subtotal      NUMERIC(16, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ÍNDICES DE RENDIMIENTO
-- =============================================================

-- Products
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_active     ON products(active);
CREATE INDEX idx_products_siigo_id   ON products(siigo_id) WHERE siigo_id IS NOT NULL;
CREATE INDEX idx_products_quality    ON products(quality);
-- Búsqueda de texto en nombre/sku (para el endpoint de search básico)
CREATE INDEX idx_products_name_trgm  ON products USING GIN (name gin_trgm_ops);

-- Clients
CREATE INDEX idx_clients_advisor     ON clients(advisor_id);
CREATE INDEX idx_clients_route       ON clients(route_id);
CREATE INDEX idx_clients_user        ON clients(user_id) WHERE user_id IS NOT NULL;

-- Quotations
CREATE INDEX idx_quotations_client   ON quotations(client_id);
CREATE INDEX idx_quotations_advisor  ON quotations(advisor_id);
CREATE INDEX idx_quotations_status   ON quotations(status);

-- Quotation items
CREATE INDEX idx_qi_quotation        ON quotation_items(quotation_id);
CREATE INDEX idx_qi_product          ON quotation_items(product_id);
