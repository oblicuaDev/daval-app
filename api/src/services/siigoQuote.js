import { query, getClient } from '../config/db.js';
import { siigoFetch } from '../lib/siigo/client.js';
import { buildSiigoQuotePayload } from '../lib/siigo/quoteMapper.js';
import { ApiError } from '../middleware/error.js';

// ─── Configuración de retry ───────────────────────────────────────────────────

const MAX_RETRIES   = Number(process.env.SIIGO_QUOTE_MAX_RETRIES ?? 3);
const RETRY_BASE_MS = Number(process.env.SIIGO_QUOTE_RETRY_BASE_MS ?? 1000);

// Códigos HTTP de SIIGO que son transitorios y ameritan reintento
const RETRYABLE_SIIGO_STATUSES = new Set([429, 500, 502, 503, 504]);

// ─── Helpers internos ─────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Extrae el HTTP status code original de SIIGO del ApiError que lanza siigoFetch.
 * El mensaje tiene el formato: "SIIGO POST /v1/invoices → 503: ..."
 */
function extractSiigoStatus(err) {
  const match = err?.message?.match(/→\s*(\d{3})/);
  return match ? Number(match[1]) : 0;
}

function isRetryableSiigoError(err) {
  if (!(err instanceof ApiError)) return false;
  if (err.code !== 'SIIGO_HTTP_ERROR') return false;
  const status = err.details?.siigoStatus ?? extractSiigoStatus(err);
  return RETRYABLE_SIIGO_STATUSES.has(status);
}

// ─── Carga de cotización ──────────────────────────────────────────────────────

/**
 * Carga la cotización interna con todos los datos necesarios para el push a SIIGO.
 * Incluye ítems, NIT del cliente y ID de SIIGO del cliente si ya fue sincronizado.
 */
async function loadQuotationForPush(quoteId) {
  const q = await query(
    `SELECT q.id, q.code, q.total, q.notes, q.status,
            q.client_id, q.advisor_id,
            cl.name         AS client_name,
            cl.nit          AS client_nit,
            cl.siigo_client_id
       FROM quotations q
       JOIN clients cl ON cl.id = q.client_id
      WHERE q.id = $1`,
    [quoteId]
  );
  const row = q.rows[0];
  if (!row) return null;

  const items = await query(
    `SELECT qi.quantity, qi.unit_price, qi.subtotal,
            p.sku, p.name AS product_name, p.siigo_id AS product_siigo_id
       FROM quotation_items qi
       JOIN products p ON p.id = qi.product_id
      WHERE qi.quotation_id = $1
      ORDER BY qi.created_at`,
    [quoteId]
  );

  return {
    id:             row.id,
    code:           row.code,
    total:          Number(row.total),
    notes:          row.notes,
    status:         row.status,
    clientId:       row.client_id,
    advisorId:      row.advisor_id,
    clientName:     row.client_name,
    clientNit:      row.client_nit,
    siigoClientId:  row.siigo_client_id,
    items: items.rows.map((it) => ({
      sku:             it.sku,
      productName:     it.product_name,
      productSiigoId:  it.product_siigo_id,
      quantity:        Number(it.quantity),
      unitPrice:       Number(it.unit_price),
      subtotal:        Number(it.subtotal),
    })),
  };
}

// ─── Validación de cliente en SIIGO ──────────────────────────────────────────

/**
 * Valida que el cliente exista en SIIGO buscando por NIT.
 * Retorna el objeto de cliente de SIIGO o lanza ApiError 422.
 *
 * TODO: Confirma el param de filtro exacto de tu plan SIIGO.
 *       La mayoría de planes: GET /v1/customers?identification={nit}
 *       Algunos planes usan: GET /v1/customers?document={nit}
 */
async function validateSiigoCustomer(nit) {
  let data;
  try {
    data = await siigoFetch('/v1/customers', {
      query: { identification: nit, page_size: 1, page: 1 },
    });
  } catch (err) {
    // Si el error es 4xx diferente a 404, lo re-lanzamos tal cual
    if (err instanceof ApiError && err.code === 'SIIGO_HTTP_ERROR') {
      const status = err.details?.siigoStatus ?? extractSiigoStatus(err);
      if (status !== 404) throw err;
    } else {
      throw err;
    }
    data = { results: [] };
  }

  const results = data?.results ?? [];
  if (results.length === 0) {
    throw new ApiError(
      422,
      'SIIGO_CUSTOMER_NOT_FOUND',
      `El cliente con NIT ${nit} no existe en SIIGO. Créalo primero en el portal SIIGO antes de enviar la cotización.`,
      { nit }
    );
  }
  return results[0];
}

// ─── Envío a SIIGO con retry ──────────────────────────────────────────────────

/**
 * Envía el payload a SIIGO con reintentos exponenciales para errores transitorios.
 * Los errores 4xx de SIIGO (datos inválidos) NO se reintentan — fallan inmediatamente.
 *
 * Endpoint confirmado: POST /v1/quotations (document.id=24096, sin payments)
 * Respuesta exitosa:   { id: UUID, name: "C-1-XXXXX", number: int, total: float, ... }
 */
async function sendToSiigoWithRetry(payload) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await siigoFetch('/v1/quotations', { method: 'POST', body: payload });
      if (attempt > 1) {
        console.log(`[siigoQuote] éxito en intento ${attempt}`);
      }
      return result;
    } catch (err) {
      lastError = err;

      if (!isRetryableSiigoError(err) || attempt === MAX_RETRIES) {
        throw err;
      }

      const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1); // 1s → 2s → 4s
      console.warn(`[siigoQuote] intento ${attempt} fallido (${err.message.slice(0, 80)}), reintentando en ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

// ─── Persistencia de integración ─────────────────────────────────────────────

async function createIntegrationLog(quoteId, payload, triggeredBy) {
  const r = await query(
    `INSERT INTO siigo_quote_integrations
       (internal_quote_id, request_payload, status, triggered_by, attempt_count)
     VALUES ($1, $2, 'pending', $3, 1)
     RETURNING id`,
    [quoteId, JSON.stringify(payload), triggeredBy ?? null]
  );
  return r.rows[0].id;
}

async function markIntegrationError(integrationId, errorMessage, responsePayload = null) {
  await query(
    `UPDATE siigo_quote_integrations
        SET status          = 'error',
            error_message   = $1,
            response_payload = $2,
            updated_at      = NOW()
      WHERE id = $3`,
    [errorMessage, responsePayload ? JSON.stringify(responsePayload) : null, integrationId]
  );
}

/**
 * Actualiza la integración como exitosa Y la cotización interna en una sola transacción.
 * Si el commit falla después de que SIIGO ya aceptó el push, loguea CRÍTICO con el SIIGO ID
 * para recuperación manual.
 */
async function markIntegrationSuccess(integrationId, quoteId, siigoQuoteId, siigoResponse) {
  const conn = await getClient();
  try {
    await conn.query('BEGIN');

    await conn.query(
      `UPDATE siigo_quote_integrations
          SET status           = 'success',
              siigo_quote_id   = $1,
              response_payload = $2,
              error_message    = NULL,
              updated_at       = NOW()
        WHERE id = $3`,
      [siigoQuoteId, JSON.stringify(siigoResponse), integrationId]
    );

    // SIIGO quotations no devuelven PDF directo en la creación.
    // Se puede obtener después con GET /v1/quotations/{id}/pdf si el plan lo soporta.
    const siigoUrl = siigoResponse?.metadata?.pdf?.media_download_link ?? null;

    await conn.query(
      `UPDATE quotations
          SET siigo_quotation_id = $1,
              siigo_url          = $2,
              status             = 'synced',
              updated_at         = NOW()
        WHERE id = $3`,
      [siigoQuoteId, siigoUrl, quoteId]
    );

    await conn.query('COMMIT');
  } catch (dbErr) {
    await conn.query('ROLLBACK');
    // CRÍTICO: SIIGO aceptó el push pero nuestro DB falló.
    // El SIIGO ID debe persistirse manualmente o por un proceso de reconciliación.
    console.error(
      `[siigoQuote] CRÍTICO: push exitoso en SIIGO (ID: ${siigoQuoteId}) pero falló el commit en DB.`,
      `integration_id: ${integrationId}, quote_id: ${quoteId}`,
      dbErr
    );
    throw new ApiError(
      500,
      'DB_COMMIT_FAILED',
      `La cotización fue aceptada por SIIGO (ID: ${siigoQuoteId}) pero falló al guardar en la base de datos. Contacta al administrador con estos datos.`,
      { siigoQuoteId, integrationId, quoteId }
    );
  } finally {
    conn.release();
  }
}

// ─── API pública del servicio ─────────────────────────────────────────────────

/**
 * Orquesta el flujo completo de push de una cotización interna a SIIGO.
 *
 * @param {string} quoteId     - UUID de la cotización interna
 * @param {string} triggeredBy - UUID del usuario que dispara la acción
 * @param {object} opts
 * @param {boolean} opts.force - Si true, ignora la guarda de idempotencia (para /retry)
 * @returns {{ integrationId, siigoQuoteId, status, quotationCode, siigoResponse }}
 */
export async function pushQuoteToSiigo(quoteId, triggeredBy, { force = false } = {}) {
  // 1. Cargar cotización interna
  const quotation = await loadQuotationForPush(quoteId);
  if (!quotation) {
    throw new ApiError(404, 'QUOTE_NOT_FOUND', `Cotización ${quoteId} no encontrada.`);
  }

  console.log(`[siigoQuote] iniciando push: ${quotation.code} (force=${force})`);

  // 2. Validar que tenga ítems
  if (quotation.items.length === 0) {
    throw new ApiError(422, 'QUOTE_HAS_NO_ITEMS', 'La cotización no tiene ítems. Agrega productos antes de enviarla a SIIGO.');
  }

  // 3. Validar que el cliente tenga NIT
  if (!quotation.clientNit) {
    throw new ApiError(
      422,
      'MISSING_CLIENT_NIT',
      `El cliente "${quotation.clientName}" no tiene NIT configurado. Actualiza el cliente antes de enviar a SIIGO.`,
      { clientId: quotation.clientId }
    );
  }

  // 4. Guarda de idempotencia — evitar doble push accidental
  if (!force) {
    const existing = await query(
      `SELECT id, siigo_quote_id FROM siigo_quote_integrations
        WHERE internal_quote_id = $1 AND status = 'success'
        LIMIT 1`,
      [quoteId]
    );
    if (existing.rows[0]) {
      const prev = existing.rows[0];
      throw new ApiError(
        409,
        'ALREADY_SYNCED',
        `La cotización ${quotation.code} ya fue enviada a SIIGO (ID: ${prev.siigo_quote_id}). Usa el endpoint /retry si necesitas reenviarla.`,
        { siigoQuoteId: prev.siigo_quote_id, integrationId: prev.id }
      );
    }
  }

  // 5. Validar que el cliente exista en SIIGO (por NIT)
  const siigoCustomer = await validateSiigoCustomer(quotation.clientNit);
  console.log(`[siigoQuote] cliente validado en SIIGO: ${siigoCustomer.id ?? siigoCustomer.identification}`);

  // 6. Construir payload SIIGO
  const payload = buildSiigoQuotePayload({
    id:    quotation.id,
    total: quotation.total,
    notes: quotation.notes,
    items: quotation.items,
    customer: {
      identification: quotation.clientNit,
      branchOffice:   siigoCustomer.branch_office ?? 0,
    },
    // TODO: Mapear advisorId (UUID) → SIIGO seller numeric ID.
    //       Agrega siigo_seller_id a la tabla users y úsalo aquí.
    sellerId: null,
  });

  // 7. Registrar intento pendiente en DB
  const integrationId = await createIntegrationLog(quoteId, payload, triggeredBy);
  console.log(`[siigoQuote] integration log creado: ${integrationId}`);

  // 8. Enviar a SIIGO (con retry automático para errores transitorios)
  let siigoResponse;
  try {
    siigoResponse = await sendToSiigoWithRetry(payload);
  } catch (err) {
    await markIntegrationError(integrationId, err.message);
    console.error(`[siigoQuote] push fallido para ${quotation.code}:`, err.message);
    throw err;
  }

  // 9. Persistir éxito de forma atómica
  // SIIGO devuelve: { id: UUID, name: "C-1-26001", number: 26001, ... }
  // Guardamos `name` (el código legible "C-1-XXXXX") como identificador principal.
  const siigoQuoteId = String(siigoResponse?.name ?? siigoResponse?.id ?? '');

  await markIntegrationSuccess(integrationId, quoteId, siigoQuoteId, siigoResponse);

  console.log(`[siigoQuote] éxito: ${quotation.code} → SIIGO ID: ${siigoQuoteId}`);

  return {
    integrationId,
    siigoQuoteId,
    status:        'success',
    quotationCode: quotation.code,
    siigoResponse,
  };
}

/**
 * Obtiene el historial de intentos de integración para una cotización.
 */
export async function getIntegrationHistory(quoteId) {
  const r = await query(
    `SELECT i.id, i.siigo_quote_id, i.status, i.error_message,
            i.attempt_count, i.created_at, i.updated_at,
            u.name AS triggered_by_name
       FROM siigo_quote_integrations i
  LEFT JOIN users u ON u.id = i.triggered_by
      WHERE i.internal_quote_id = $1
      ORDER BY i.created_at DESC`,
    [quoteId]
  );
  return r.rows;
}
