import { query } from '../../config/db.js';
import { ApiError } from '../../middleware/error.js';

/**
 * Cliente HTTP de SIIGO.
 * - Persiste el access_token en siigo_settings (cached_token, cached_token_expires)
 * - Refresca automáticamente cuando expira o cuando recibe 401
 * - Single-tenant (siempre id=1)
 */

const TOKEN_SAFETY_MARGIN_MS = 60_000; // refresca 60s antes de expirar

async function loadSettings() {
  const r = await query(`SELECT * FROM siigo_settings WHERE id = 1`);
  const s = r.rows[0];
  if (!s) throw new ApiError(500, 'SIIGO_NOT_INITIALIZED', 'siigo_settings vacío. Corre la migración 002.');
  return s;
}

async function saveToken(token, expiresAt) {
  await query(
    `UPDATE siigo_settings
        SET cached_token = $1, cached_token_expires = $2, updated_at = NOW()
      WHERE id = 1`,
    [token, expiresAt]
  );
}

async function authenticate(settings) {
  if (!settings.username || !settings.access_key) {
    throw new ApiError(400, 'SIIGO_NOT_CONFIGURED', 'Falta username o access_key en siigo_settings.');
  }
  console.log(`${settings.base_url}/auth`);
  
  const url = `${settings.base_url}/auth`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: settings.username, access_key: settings.access_key }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(502, 'SIIGO_AUTH_FAILED', `SIIGO auth ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const token = data.access_token;
  const expiresInSec = Number(data.expires_in ?? 86400);
  const expiresAt = new Date(Date.now() + expiresInSec * 1000);
  await saveToken(token, expiresAt);
  return { token, expiresAt };
}

async function getValidToken(settings, force = false) {
  const expiresAtMs = settings.cached_token_expires ? new Date(settings.cached_token_expires).getTime() : 0;
  const expiringSoon = expiresAtMs - Date.now() < TOKEN_SAFETY_MARGIN_MS;
  if (!force && settings.cached_token && !expiringSoon) {
    return settings.cached_token;
  }
  const fresh = await authenticate(settings);
  return fresh.token;
}

/**
 * Realiza una llamada autenticada a la API de SIIGO.
 * Refresca token y reintenta UNA vez si la respuesta es 401.
 */
export async function siigoFetch(path, { method = 'GET', body, query: qs } = {}) {
  const settings = await loadSettings();
  let token = await getValidToken(settings);

  const url = new URL(`${settings.base_url}${path}`);
  if (qs) for (const [k, v] of Object.entries(qs)) {
    if (v != null) url.searchParams.append(k, String(v));
  }

  const doRequest = async (tk) => fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Partner-Id': settings.partner_id ?? 'DavalApp',
      Authorization: `Bearer ${tk}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let res = await doRequest(token);
  if (res.status === 401) {
    token = await getValidToken(settings, true);
    res = await doRequest(token);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(502, 'SIIGO_HTTP_ERROR', `SIIGO ${method} ${path} → ${res.status}: ${text.slice(0, 400)}`, { siigoStatus: res.status });
  }
  return res.json();
}

/** Probe rápido: auth + listar 1 producto. Devuelve { ok, expiresAt, sample }. */
export async function testConnection() {
  const settings = await loadSettings();
  const { expiresAt } = await authenticate(settings);
  const probe = await siigoFetch('/v1/products', { query: { page_size: 1, page: 1 } });
  return {
    ok: true,
    partnerId: settings.partner_id,
    username: settings.username,
    tokenExpiresAt: expiresAt.toISOString(),
    productCountSample: probe?.pagination?.total_results ?? null,
  };
}
