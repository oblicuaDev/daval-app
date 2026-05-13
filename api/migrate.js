/**
 * Ejecuta esquema + migraciones contra PostgreSQL/Supabase.
 *
 * Uso (desde la raíz del proyecto):
 *   node api/migrate.js           — solo migraciones
 *   node api/migrate.js --seed    — migraciones + seed de desarrollo
 *
 * DATABASE_URL se lee de api/.env si no está en el entorno del sistema.
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pg from 'pg';

const __dir   = path.dirname(fileURLToPath(import.meta.url));
const ROOT    = path.join(__dir, '..');
const DB_DIR  = path.join(ROOT, 'database');
const SEED    = process.argv.includes('--seed');

// ── 1. Cargar api/.env manualmente (dotenv no está disponible aquí todavía) ─
if (!process.env.DATABASE_URL) {
  const envFile = path.join(__dir, '.env');
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key && !process.env[key]) process.env[key] = val;
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL no encontrado. Revisar api/.env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  connectionTimeoutMillis: 10_000,
});

// ── 2. Lista de archivos a ejecutar en orden ──────────────────────────────────
//   name   → clave única en _migrations (no cambiar una vez aplicado)
//   file   → ruta relativa desde database/
//   check  → query SQL; si retorna filas, el archivo se omite (ya aplicado)
const STEPS = [
  {
    name: '000_schema',
    file: 'schema.sql',
    // Omitir si la tabla users ya existe (schema ya fue aplicado)
    check: `SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='users'`,
  },
  { name: '001_phase1',              file: 'migrations/001_phase1.sql' },
  { name: '002_siigo_module',        file: 'migrations/002_siigo_module.sql' },
  { name: '003_perf_indexes',        file: 'migrations/003_perf_indexes.sql' },
  { name: '004_geo_and_cleanup',     file: 'migrations/004_geo_and_cleanup.sql' },
  { name: '005_routes_geocols',      file: 'migrations/005_routes_geocols.sql' },
  { name: '006_uq_product_price_list', file: '../database/alter.pgsql',
    // alter.pgsql está una carpeta arriba de database/migrations — apuntamos al raíz
    file: 'alter.pgsql' },
  ...(SEED ? [{ name: 'seed_001_initial', file: 'seeds/001_initial.sql' }] : []),
];

// Corregir: alter.pgsql está en database/, no en database/migrations/
STEPS.find(s => s.name === '006_uq_product_price_list').file = 'alter.pgsql';

// ── 3. Runner ─────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  let failed = false;

  try {
    // Tabla de tracking (idempotente)
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       TEXT        PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Extensiones requeridas por el esquema (siempre idempotente)
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    `);
    console.log('✓  Extensiones: uuid-ossp, pg_trgm');

    for (const step of STEPS) {
      // ¿Ya registrada en _migrations?
      const { rows: tracked } = await client.query(
        `SELECT 1 FROM _migrations WHERE name = $1`, [step.name]
      );
      if (tracked.length > 0) {
        console.log(`⏭  ${step.name} — ya aplicada`);
        continue;
      }

      // ¿Check de skip personalizado?
      if (step.check) {
        const { rows: existing } = await client.query(step.check);
        if (existing.length > 0) {
          console.log(`⏭  ${step.name} — condición de skip cumplida, omitiendo`);
          await client.query(`INSERT INTO _migrations(name) VALUES($1) ON CONFLICT DO NOTHING`, [step.name]);
          continue;
        }
      }

      const filePath = path.join(DB_DIR, step.file);
      if (!existsSync(filePath)) {
        console.warn(`⚠   ${step.name} — archivo no encontrado: ${filePath}`);
        continue;
      }

      const sql = readFileSync(filePath, 'utf-8');

      try {
        await client.query(sql);
        await client.query(`INSERT INTO _migrations(name) VALUES($1)`, [step.name]);
        console.log(`✅  ${step.name} — aplicada`);
      } catch (err) {
        console.error(`❌  ${step.name} — error: ${err.message}`);
        failed = true;
        break;
      }
    }

    if (!failed) {
      console.log('\n✅  Todas las migraciones completadas.\n');
    } else {
      console.error('\n❌  Proceso detenido por error. Revisar la migración fallida.\n');
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err.message);
  process.exit(1);
});
