import { query } from '../config/db.js';

/**
 * Resolve effective price per product for a given price list and active promotions.
 * Locked rule: finalPrice = min(promotionPrice, priceListPrice).
 *
 * Inputs:
 *   productIds  : UUID[]
 *   priceListId : UUID|null  (when null, falls back to default price list)
 *   clientId    : UUID|null  (used to scope 'specific' promotions)
 *
 * Output: Map<productId, { basePrice, priceListPrice, promotionPrice, finalPrice, priceListId }>
 */
export async function resolvePrices({ productIds, priceListId, clientId }) {
  if (!productIds.length) return new Map();

  // 1. Resolve the price list (caller's, or default) — single query with fallback
  const plr = await query(
    `SELECT id, multiplier FROM price_lists
      WHERE active = TRUE
        AND (id = $1 OR (is_default = TRUE AND $1 IS NULL))
      ORDER BY (id = $1) DESC
      LIMIT 1`,
    [priceListId ?? null]
  );
  let priceList = plr.rows[0] ?? null;

  // 2. Per-product price list override + base price
  const priceRows = await query(
    `SELECT p.id, p.sku, p.base_price,
            ppl.price AS list_price
       FROM products p
       LEFT JOIN product_price_lists ppl
         ON ppl.product_id = p.id AND ppl.price_list_id = $2
      WHERE p.id = ANY($1::uuid[])`,
    [productIds, priceList?.id ?? null]
  );

  // 3. Active promotion prices for these SKUs (scoped to client if 'specific')
  const skus = priceRows.rows.map(r => r.sku);
  const promoRows = skus.length
    ? await query(
        `SELECT pp.sku, MIN(pp.price) AS promo_price
           FROM promotions pr
           JOIN promotion_prices pp ON pp.promotion_id = pr.id
      LEFT JOIN promotion_clients pc ON pc.promotion_id = pr.id
          WHERE pr.active = TRUE
            AND NOW() BETWEEN pr.starts_at AND pr.ends_at
            AND pp.sku = ANY($1::text[])
            AND (pr.scope = 'all' OR pc.client_id = $2::uuid)
          GROUP BY pp.sku`,
        [skus, clientId]
      )
    : { rows: [] };
  const promoBySku = new Map(promoRows.rows.map(r => [r.sku, Number(r.promo_price)]));

  // 4. Combine — finalPrice = min(promotionPrice, priceListPrice)
  const out = new Map();
  for (const row of priceRows.rows) {
    const basePrice = Number(row.base_price);
    const listPrice = row.list_price != null
      ? Number(row.list_price)
      : Math.round(basePrice * Number(priceList?.multiplier ?? 1) * 100) / 100;
    const promoPrice = promoBySku.get(row.sku) ?? null;
    const finalPrice = promoPrice != null ? Math.min(promoPrice, listPrice) : listPrice;
    out.set(row.id, {
      basePrice,
      priceListPrice: listPrice,
      promotionPrice: promoPrice,
      finalPrice,
      priceListId: priceList?.id ?? null,
    });
  }
  return out;
}
