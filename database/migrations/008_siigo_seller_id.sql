-- Agrega el ID numérico de vendedor en SIIGO a la tabla users.
-- Permite mapear automáticamente el asesor interno → campo seller en cotizaciones SIIGO.
--
-- IDs confirmados contra cuenta DISTRIBUCIONES DAVAL SAS (2026-05-13):
--   1374 → JUAN CARLOS LAVERDE     (vtasdaval4@gmail.com)
--   1388 → JUSTO PASTOR LAVERDE MEJIA (vtasdaval9@gmail.com)
--   1402 → ALEXIS SEPULVEDA        (contadordaval@gmail.com)
--   1335 → CONTABILIDAD 1          (auxiliaradmondaval@gmail.com)

ALTER TABLE users ADD COLUMN IF NOT EXISTS siigo_seller_id INTEGER;
