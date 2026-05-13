-- =============================================================
-- DAVAL APP — Seed de desarrollo (idempotente)
-- Ejecutar contra daval_db_dev después de todas las migraciones.
-- Passwords: admin/admin123, asesor/asesor123, cliente/cliente123
-- =============================================================

BEGIN;

-- ----------------------------------------------------------------
-- Categorías
-- ----------------------------------------------------------------
INSERT INTO categories (id, name, description, active) VALUES
  ('11111111-0001-0000-0000-000000000001', 'Herramientas Manuales',   'Martillos, destornilladores, llaves y más', TRUE),
  ('11111111-0001-0000-0000-000000000002', 'Herramientas Eléctricas', 'Taladros, pulidoras, sierras', TRUE),
  ('11111111-0001-0000-0000-000000000003', 'Ferretería General',      'Tornillos, tuercas, pernos y fijaciones', TRUE),
  ('11111111-0001-0000-0000-000000000004', 'Plomería y Sanitarios',   'Tuberías, válvulas, llaves y accesorios', TRUE),
  ('11111111-0001-0000-0000-000000000005', 'Pinturas y Adhesivos',    'Cintas, siliconas, sellantes, pinturas', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Usuarios (bcrypt $2b$10$ hash de contraseñas de ejemplo)
-- admin123  → $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- asesor123 → $2b$10$v8EigN9.zIqKqAjJzGIJO.GBdLPUWdCWR0pxiVPrr7xqWqh2g1U2
-- cliente123→ $2b$10$F1BV.nz0bAixvTCt.n9mEuK4TwDYMFV9x1VPaZk3Nkp1y8rr9I.m
-- NOTA: regenerar con bcrypt en producción
-- ----------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, active, company_id, branch_id) VALUES
  ('22222222-0001-0000-0000-000000000001',
   'Admin Daval', 'admin@daval.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'admin', TRUE, NULL, NULL),

  ('22222222-0002-0000-0000-000000000001',
   'Carlos Asesor', 'asesor@daval.com',
   '$2b$10$v8EigN9.zIqKqAjJzGIJO.GBdLPUWdCWR0pxiVPrr7xqWqh2g1U2',
   'advisor', TRUE, NULL, NULL),

  ('22222222-0003-0000-0000-000000000001',
   'Juan Cliente', 'cliente@daval.com',
   '$2b$10$F1BV.nz0bAixvTCt.n9mEuK4TwDYMFV9x1VPaZk3Nkp1y8rr9I.m',
   'client', TRUE, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Listas de precios
-- ----------------------------------------------------------------
INSERT INTO price_lists (id, name, description, multiplier, is_default, active) VALUES
  ('33333333-0001-0000-0000-000000000001', 'Lista General',    'Precios estándar para todos los clientes', 1.00, TRUE,  TRUE),
  ('33333333-0002-0000-0000-000000000001', 'Lista Mayorista',  'Descuento 15% sobre precio base',          0.85, FALSE, TRUE),
  ('33333333-0003-0000-0000-000000000001', 'Lista Preferencial','Descuento 20% sobre precio base',         0.80, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Rutas comerciales
-- ----------------------------------------------------------------
INSERT INTO routes (id, name, description, active,
                    day, cutoff_time, city,
                    quadrant_id, bounds, center) VALUES
  ('44444444-0001-0000-0000-000000000001',
   'Ruta Norte Bogotá', 'Zona norte empresarial', TRUE,
   'Lunes', '16:00', 'Bogotá',
   'custom',
   '{"north":4.735,"south":4.685,"east":-74.045,"west":-74.105}',
   '{"lat":4.711,"lng":-74.0721}'),

  ('44444444-0002-0000-0000-000000000001',
   'Ruta Sur Bogotá', 'Zona sur industrial', TRUE,
   'Miércoles', '15:00', 'Bogotá',
   'custom',
   '{"north":4.600,"south":4.550,"east":-74.095,"west":-74.150}',
   '{"lat":4.575,"lng":-74.122}')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Empresas
-- ----------------------------------------------------------------
INSERT INTO companies (id, name, nit, email, phone, address, active) VALUES
  ('55555555-0001-0000-0000-000000000001',
   'Ferretería Industrial Norte S.A.S.', '900.123.456-7',
   'contacto@ferreteria-norte.com', '601-234-5678', 'Cra 7 # 15-30, Bogotá', TRUE),

  ('55555555-0002-0000-0000-000000000001',
   'Construcciones Rápidas Ltda.', '800.987.654-3',
   'info@construrap.com', '601-876-5432', 'Calle 80 # 45-12, Bogotá', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Sucursales
-- ----------------------------------------------------------------
INSERT INTO company_branches (id, company_id, name, address, city, route_id, advisor_id, active) VALUES
  ('66666666-0001-0000-0000-000000000001',
   '55555555-0001-0000-0000-000000000001',
   'Sede Principal Norte', 'Cra 7 # 15-30', 'Bogotá',
   '44444444-0001-0000-0000-000000000001',
   '22222222-0002-0000-0000-000000000001', TRUE),

  ('66666666-0002-0000-0000-000000000001',
   '55555555-0002-0000-0000-000000000001',
   'Sede Sur Industrial', 'Calle 80 # 45-12', 'Bogotá',
   '44444444-0002-0000-0000-000000000001',
   '22222222-0002-0000-0000-000000000001', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Clientes (vinculados a usuarios y sucursales)
-- ----------------------------------------------------------------
INSERT INTO clients (id, name, nit, email, phone, user_id, advisor_id, route_id, price_list_id, active) VALUES
  ('77777777-0001-0000-0000-000000000001',
   'Juan Cliente — Ferretería Norte', '900.123.456-7',
   'cliente@daval.com', '311-000-0001',
   '22222222-0003-0000-0000-000000000001',
   '22222222-0002-0000-0000-000000000001',
   '44444444-0001-0000-0000-000000000001',
   '33333333-0001-0000-0000-000000000001', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Vincular usuario cliente a la sucursal
UPDATE users SET branch_id = '66666666-0001-0000-0000-000000000001',
                 company_id = '55555555-0001-0000-0000-000000000001'
 WHERE id = '22222222-0003-0000-0000-000000000001'
   AND branch_id IS NULL;

-- ----------------------------------------------------------------
-- Productos de muestra
-- ----------------------------------------------------------------
INSERT INTO products (id, sku, name, unit, stock, quality, base_price, active, category_id, description) VALUES
  ('88888888-0001-0000-0000-000000000001', '001001', 'Martillo Carpintero 16oz',    'Und', 50, 'standard',  45000, TRUE, '11111111-0001-0000-0000-000000000001', 'Martillo de carpintero con mango de madera'),
  ('88888888-0002-0000-0000-000000000001', '001002', 'Destornillador Pala 6"',       'Und', 80, 'standard',  12000, TRUE, '11111111-0001-0000-0000-000000000001', 'Destornillador pala con mango aislado'),
  ('88888888-0003-0000-0000-000000000001', '001003', 'Llave Mixta 12mm',             'Und', 60, 'high',      18500, TRUE, '11111111-0001-0000-0000-000000000001', 'Llave mixta cromo-vanadio 12mm'),
  ('88888888-0004-0000-0000-000000000001', '002001', 'Taladro Percutor 700W',        'Und', 20, 'high',     250000, TRUE, '11111111-0001-0000-0000-000000000002', 'Taladro percutor reversible 700W'),
  ('88888888-0005-0000-0000-000000000001', '002002', 'Pulidora Angular 4.5"',        'Und', 15, 'high',     180000, TRUE, '11111111-0001-0000-0000-000000000002', 'Pulidora angular con disco de desbaste'),
  ('88888888-0006-0000-0000-000000000001', '003001', 'Tornillos Drywall 3.5x25 x100','Pkg', 200, 'standard',  8500, TRUE, '11111111-0001-0000-0000-000000000003', 'Paquete x100 tornillos punta broca'),
  ('88888888-0007-0000-0000-000000000001', '003002', 'Perno Hex 1/2x2" x50',        'Pkg', 120, 'standard', 22000, TRUE, '11111111-0001-0000-0000-000000000003', 'Paquete x50 pernos hexagonales galvanizados'),
  ('88888888-0008-0000-0000-000000000001', '004001', 'Tubería PVC 1/2" x 6m',       'Und', 40, 'standard',  35000, TRUE, '11111111-0001-0000-0000-000000000004', 'Tubería PVC presión 1/2 pulgada'),
  ('88888888-0009-0000-0000-000000000001', '004002', 'Llave de paso 1/2" cromada',   'Und', 30, 'high',      28000, TRUE, '11111111-0001-0000-0000-000000000004', 'Llave de paso esfera 1/2 pulgada'),
  ('88888888-0010-0000-0000-000000000001', '005001', 'Silicona Transparente 280ml',  'Und', 90, 'standard',  15000, TRUE, '11111111-0001-0000-0000-000000000005', 'Silicona neutral transparente multipropósito'),
  ('88888888-0011-0000-0000-000000000001', '005002', 'Cinta Enmascarar 2"',          'Und', 150,'standard',   5500, TRUE, '11111111-0001-0000-0000-000000000005', 'Cinta de enmascarar para pintura'),
  ('88888888-0012-0000-0000-000000000001', '002003', 'Sierra Circular 1400W 7.25"',  'Und', 10, 'premium',  380000, TRUE, '11111111-0001-0000-0000-000000000002', 'Sierra circular con guía láser')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Precios en lista general (product_price_lists)
-- ----------------------------------------------------------------
INSERT INTO product_price_lists (product_id, price_list_id, price, price_list_name) VALUES
  ('88888888-0001-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 45000, 'Lista General'),
  ('88888888-0002-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 12000, 'Lista General'),
  ('88888888-0003-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 18500, 'Lista General'),
  ('88888888-0004-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 250000,'Lista General'),
  ('88888888-0005-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 180000,'Lista General'),
  ('88888888-0006-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 8500,  'Lista General'),
  ('88888888-0007-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 22000, 'Lista General'),
  ('88888888-0008-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 35000, 'Lista General'),
  ('88888888-0009-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 28000, 'Lista General'),
  ('88888888-0010-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 15000, 'Lista General'),
  ('88888888-0011-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 5500,  'Lista General'),
  ('88888888-0012-0000-0000-000000000001', '33333333-0001-0000-0000-000000000001', 380000,'Lista General')
ON CONFLICT (product_id, price_list_id) DO NOTHING;

-- Precios en lista mayorista (85% del base)
INSERT INTO product_price_lists (product_id, price_list_id, price, price_list_name) VALUES
  ('88888888-0001-0000-0000-000000000001', '33333333-0002-0000-0000-000000000001', 38250, 'Lista Mayorista'),
  ('88888888-0002-0000-0000-000000000001', '33333333-0002-0000-0000-000000000001', 10200, 'Lista Mayorista'),
  ('88888888-0004-0000-0000-000000000001', '33333333-0002-0000-0000-000000000001', 212500,'Lista Mayorista'),
  ('88888888-0008-0000-0000-000000000001', '33333333-0002-0000-0000-000000000001', 29750, 'Lista Mayorista')
ON CONFLICT (product_id, price_list_id) DO NOTHING;

-- ----------------------------------------------------------------
-- Secuencia de cotizaciones (si no existe)
-- ----------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS quotation_code_seq START 1;

COMMIT;
