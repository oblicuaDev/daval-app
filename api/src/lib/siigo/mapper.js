/**
 * Transforma un producto SIIGO al modelo local.
 * Esquema de SIIGO (resumen):
 *   { id, code, name, type, active, available_quantity,
 *     unit: { code, name }, prices: [{ currency_code, price_list: [{ name, value }] }] }
 */
export function mapSiigoProduct(siigo) {
  const firstPriceBlock = Array.isArray(siigo.prices) ? siigo.prices[0] : null;
  const priceLists = firstPriceBlock?.price_list ?? [];
  const basePrice = priceLists[0]?.value ?? 0;

  return {
    siigo_id: String(siigo.id),
    sku: siigo.code ?? String(siigo.id),
    name: siigo.name ?? '(sin nombre)',
    unit: siigo.unit?.name ?? siigo.unit?.code ?? null,
    stock: Number(siigo.available_quantity ?? 0),
    base_price: Number(basePrice),
    active: Boolean(siigo.active ?? true),
    image_url: siigo.metadata?.image_url ?? null,
    priceLists: priceLists.map(pl => ({
      name: pl.name,
      price: Number(pl.value ?? 0),
      currency: firstPriceBlock?.currency_code ?? 'COP',
    })),
  };
}
