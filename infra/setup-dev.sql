-- =============================================================
-- DAVAL APP — Creación de rol, base de datos y privilegios (DEV)
-- Ejecutar como superusuario: psql -U postgres -f infra/setup-dev.sql
-- =============================================================

-- Rol
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'daval_dev') THEN
    CREATE ROLE daval_dev LOGIN PASSWORD 'daval_dev_pass';
    RAISE NOTICE 'Rol daval_dev creado.';
  ELSE
    RAISE NOTICE 'Rol daval_dev ya existe. Omitido.';
  END IF;
END
$$;

-- Base de datos
SELECT 'CREATE DATABASE daval_db_dev OWNER daval_dev ENCODING ''UTF8'' LC_COLLATE ''en_US.UTF-8'' LC_CTYPE ''en_US.UTF-8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'daval_db_dev') \gexec

-- Privilegios
GRANT ALL PRIVILEGES ON DATABASE daval_db_dev TO daval_dev;

\echo '>>> setup-dev.sql completado: rol daval_dev y base de datos daval_db_dev listos.'
