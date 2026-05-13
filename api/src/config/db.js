import pg from 'pg';

const { Pool } = pg;

function buildConfig() {
  const base = {
    max:                     Number(process.env.DB_MAX_CONNECTIONS) || 10,
    idleTimeoutMillis:       30_000,
    connectionTimeoutMillis: 5_000,
  };

  // DATABASE_URL tiene precedencia — usado en Supabase, Railway, Render
  if (process.env.DATABASE_URL) {
    return {
      ...base,
      connectionString: process.env.DATABASE_URL,
      // Supabase requiere SSL; rejectUnauthorized:false soporta certs self-signed en Render/Railway
      ssl: { rejectUnauthorized: false },
    };
  }

  // Fallback: vars individuales para dev local con PostgreSQL sin SSL
  return {
    ...base,
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME     || 'daval_db_dev',
    user:     process.env.DB_USER     || 'daval_dev',
    password: process.env.DB_PASSWORD,
  };
}

const pool = new Pool(buildConfig());

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en cliente inactivo:', err.message);
  process.exit(1);
});

/**
 * Ejecuta una query con parámetros posicionales ($1, $2, ...).
 * @param {string} text  - Consulta SQL
 * @param {any[]}  params - Parámetros de la consulta
 */
export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] query(${Date.now() - start}ms):`, text.slice(0, 80));
  }
  return res;
}

/**
 * Obtiene un cliente dedicado del pool para transacciones manuales.
 * El llamador es responsable de invocar client.release().
 */
export async function getClient() {
  return pool.connect();
}

export default pool;
