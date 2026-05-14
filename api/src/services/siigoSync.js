import { query, getClient } from '../config/db.js';
import { siigoFetch } from '../lib/siigo/client.js';
import { mapSiigoProduct } from '../lib/siigo/mapper.js';
import { ApiError } from '../middleware/error.js';

/**
 * Servicio de sincronización SIIGO.
 * - Mantiene estado en siigo_settings.last_sync_*
 * - Escribe historial en siigo_sync_logs
 * - syncProducts es idempotente: upsert por siigo_id
 *
 * Para un solo proceso Node es suficiente correr la sync en background con un Promise.
 * Si en el futuro se escala a N réplicas, mover a una cola (BullMQ/Redis).
 */

const PAGE_SIZE = 100;

/** Devuelve true si actualmente hay un sync 'running'. */
export async function isSyncRunning() {
  const r = await query(`SELECT last_sync_status FROM siigo_settings WHERE id = 1`);
  return r.rows[0]?.last_sync_status === 'running';
}

/** Resetea syncs atascados (llamar al arrancar el servidor). */
export async function resetStuckSync() {
  const r = await query(
    `UPDATE siigo_settings
        SET last_sync_status = 'error',
            last_sync_error = 'Reset al reiniciar servidor',
            last_sync_finished_at = COALESCE(last_sync_finished_at, NOW()),
            updated_at = NOW()
      WHERE last_sync_status = 'running'`
  );
  if (r.rowCount > 0) {
    await query(
      `UPDATE siigo_sync_logs
          SET status = 'error', finished_at = COALESCE(finished_at, NOW()),
              error_message = 'Interrumpido — proceso reiniciado'
        WHERE status = 'running'`
    );
    console.warn('[siigoSync] sync atascado encontrado al arrancar — reseteado a error');
  }
}

/** Lanza la sync en background y retorna el log id. No espera a que termine. */
export async function startProductsSync(triggeredBy) {
  if (await isSyncRunning()) {
    throw new ApiError(409, 'SYNC_ALREADY_RUNNING', 'Ya hay una sincronización en curso.');
  }

  const log = await query(
    `INSERT INTO siigo_sync_logs (kind, status, triggered_by)
     VALUES ('products', 'running', $1) RETURNING id`,
    [triggeredBy ?? null]
  );
  const logId = log.rows[0].id;

  await query(
    `UPDATE siigo_settings
        SET last_sync_started_at = NOW(),
            last_sync_finished_at = NULL,
            last_sync_status = 'running',
            last_sync_count = 0,
            last_sync_error = NULL,
            updated_at = NOW()
      WHERE id = 1`
  );

  // Fire-and-forget. Errores se persisten en el log.
  runProductsSync(logId).catch((err) => {
    console.error('[siigoSync] uncaught error', err);
  });

  return { logId };
}

async function runProductsSync(logId) {
  let page = 1;
  let processed = 0;
  let created = 0;
  let updated = 0;
  let errors = 0;

  console.log(`[siigoSync] inicio sync — logId=${logId}`);

  try {
    while (true) {
      console.log(`[siigoSync] consultando página ${page} (page_size=${PAGE_SIZE})`);
      const data = await siigoFetch('/v1/products', {
        query: { page_size: PAGE_SIZE, page },
      });
      const results = data?.results ?? [];
      if (results.length === 0) {
        console.log(`[siigoSync] página ${page} sin resultados — sync completo`);
        break;
      }

      for (const raw of results) {
        try {
          const p = mapSiigoProduct(raw);
          const out = await upsertProduct(p);
          processed += 1;
          if (out.created) created += 1; else updated += 1;
        } catch (itemErr) {
          errors += 1;
          console.error(`[siigoSync] error procesando producto siigo_id=${raw?.id}:`, itemErr.message);
        }
      }

      const total = data?.pagination?.total_results;
      console.log(`[siigoSync] página ${page}: ${results.length} items, total=${total ?? '?'}, procesados=${processed}`);
      if (typeof total === 'number' && processed + errors >= total) break;
      if (results.length < PAGE_SIZE) break;
      page += 1;
    }

    const status = errors > 0 && processed === 0 ? 'error' : 'success';
    const errMsg = errors > 0 ? `${errors} producto(s) con error` : null;
    console.log(`[siigoSync] finalizado — status=${status} created=${created} updated=${updated} errors=${errors}`);
    await finishSync(logId, status, { processed, created, updated, error: errMsg });
  } catch (err) {
    console.error('[siigoSync] error fatal en sync:', err.message);
    await finishSync(logId, 'error', { processed, created, updated, error: err.message });
    throw err;
  }
}

async function finishSync(logId, status, { processed, created, updated, error = null }) {
  await query(
    `UPDATE siigo_sync_logs
        SET status = $1, finished_at = NOW(),
            items_processed = $2, items_created = $3, items_updated = $4,
            error_message = $5
      WHERE id = $6`,
    [status, processed, created, updated, error, logId]
  );
  await query(
    `UPDATE siigo_settings
        SET last_sync_finished_at = NOW(),
            last_sync_status = $1,
            last_sync_count = $2,
            last_sync_error = $3,
            updated_at = NOW()
      WHERE id = 1`,
    [status, processed, error]
  );
}

/**
 * Upsert por siigo_id. También sincroniza product_price_lists (delete-and-reinsert
 * para esa price_list_name por simplicidad — los volúmenes son bajos por producto).
 *
 * Retorna { id, created: boolean }.
 */
async function upsertProduct(p) {
  const conn = await getClient();
  try {
    await conn.query('BEGIN');

    const existing = await conn.query(
      `SELECT id FROM products WHERE siigo_id = $1`,
      [p.siigo_id]
    );

    let productId;
    let created;
    if (existing.rows[0]) {
      productId = existing.rows[0].id;
      created = false;
      await conn.query(
        `UPDATE products
            SET sku = $1, name = $2, unit = $3, stock = $4,
                base_price = $5, active = $6,
                image_url = COALESCE($7, image_url),
                last_sync_at = NOW(), updated_at = NOW()
          WHERE id = $8`,
        [p.sku, p.name, p.unit, p.stock, p.base_price, p.active, p.image_url, productId]
      );
    } else {
      const ins = await conn.query(
        `INSERT INTO products
           (siigo_id, sku, name, unit, stock, base_price, active, image_url, last_sync_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
         RETURNING id`,
        [p.siigo_id, p.sku, p.name, p.unit, p.stock, p.base_price, p.active, p.image_url]
      );
      productId = ins.rows[0].id;
      created = true;
    }

    // Listas de precios: upsert por (product_id, price_list_name)
    // Requiere UNIQUE INDEX uniq_ppl_product_price_list_name — creado en migración 010
    for (const pl of p.priceLists) {
      if (!pl.name) continue;
      await conn.query(
        `INSERT INTO product_price_lists (product_id, price_list_name, price, currency)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (product_id, price_list_name)
           DO UPDATE SET price = EXCLUDED.price,
                         currency = EXCLUDED.currency,
                         updated_at = NOW()`,
        [productId, pl.name, pl.price, pl.currency ?? 'COP']
      );
    }

    await conn.query('COMMIT');
    return { id: productId, created };
  } catch (e) {
    await conn.query('ROLLBACK');
    throw e;
  } finally {
    conn.release();
  }
}
