-- =============================================================
-- DAVAL APP — Rol y base de datos PROD (idempotente)
-- Ejecutar como superusuario:
--   sudo -u postgres psql -v PROD_PASS="'<password>'" -f infra/setup-prod.sql
-- =============================================================

-- Rol
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'daval_prod') THEN
    EXECUTE format('CREATE ROLE daval_prod LOGIN PASSWORD %L', :'PROD_PASS');
    RAISE NOTICE 'Rol daval_prod creado.';
  ELSE
    EXECUTE format('ALTER ROLE daval_prod WITH PASSWORD %L', :'PROD_PASS');
    RAISE NOTICE 'Rol daval_prod ya existía. Password actualizado.';
  END IF;
END
$$;

-- Base de datos
SELECT 'CREATE DATABASE daval_db_prod OWNER daval_prod ENCODING ''UTF8'' LC_COLLATE ''en_US.UTF-8'' LC_CTYPE ''en_US.UTF-8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'daval_db_prod') \gexec

GRANT ALL PRIVILEGES ON DATABASE daval_db_prod TO daval_prod;

\echo '>>> setup-prod.sql completado: rol daval_prod + base daval_db_prod listos.'
