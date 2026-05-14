import { z } from 'zod';

/**
 * SIIGO IDs confirmados contra la cuenta real (2026-05-13):
 *   Document type 24096 → Cotización (C-1-XXXXX), endpoint POST /v1/quotations
 *   IVA 0%      17085  → Impuesto IVA al 0% (el más usado para ferretería)
 *   IVA 19%     12967  → IVA estándar (usar si el producto aplica)
 *
 * Si migras de cuenta o cambia el plan, reverifica con:
 *   GET /v1/quotations?page_size=1  → lee el document.id de un registro real
 *   GET /v1/taxes                   → lista todos los impuestos disponibles
 */
const SIIGO_QUOTE_DOC_TYPE_ID = Number(process.env.SIIGO_QUOTE_DOC_TYPE_ID ?? 24096);
const SIIGO_DEFAULT_TAX_ID    = Number(process.env.SIIGO_DEFAULT_TAX_ID    ?? 17085); // IVA 0%

// ─── Esquemas de validación interna ──────────────────────────────────────────

const ItemSchema = z.object({
  sku:         z.string().min(1, 'El SKU del producto es requerido'),
  productName: z.string().min(1),
  quantity:    z.number().positive('La cantidad debe ser positiva'),
  unitPrice:   z.number().nonnegative('El precio unitario no puede ser negativo'),
  subtotal:    z.number().nonnegative(),
  // taxId de SIIGO para este ítem (17085=IVA 0%, 12967=IVA 19%). Viene del producto si está configurado.
  taxId:       z.number().int().positive().optional().nullable(),
});

const CustomerSchema = z.object({
  identification: z.string().min(1, 'El NIT del cliente es requerido'),
  branchOffice:   z.number().int().nonnegative().default(0),
});

const InternalQuoteSchema = z.object({
  id:             z.string().uuid(),
  total:          z.number().positive('El total debe ser positivo'),
  notes:          z.string().nullable().optional(),
  items:          z.array(ItemSchema).min(1, 'La cotización debe tener al menos un ítem'),
  customer:       CustomerSchema,
  documentTypeId: z.number().int().positive().optional().nullable(),
  // Seller: SIIGO usa IDs numéricos de GET /v1/users (ej: 1374, 1388, 1402).
  // Para mapearlo automáticamente, agrega columna siigo_seller_id INTEGER a la tabla users.
  sellerId:       z.number().int().positive().optional().nullable(),
});

// ─── Builder principal ────────────────────────────────────────────────────────

/**
 * Convierte una cotización interna al payload de POST /v1/quotations de SIIGO.
 *
 * Endpoint confirmado: POST https://api.siigo.com/v1/quotations
 * Formato de respuesta: { id: UUID, name: "C-1-XXXXX", number: int, ... }
 *
 * Las cotizaciones en SIIGO NO llevan payments — eso va en la factura final.
 */
export function buildSiigoQuotePayload(internalQuote) {
  const data = InternalQuoteSchema.parse(internalQuote);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const payload = {
    document: {
      id: data.documentTypeId ?? SIIGO_QUOTE_DOC_TYPE_ID,
    },
    date: today,
    customer: {
      identification: data.customer.identification,
      branch_office:  data.customer.branchOffice,
    },
    observations: data.notes ?? '',
    items: data.items.map((it) => ({
      code:        it.sku,
      description: it.productName,
      quantity:    it.quantity,
      price:       it.unitPrice,
      discount:    0,
      // Impuesto por ítem. SIIGO lo requiere; usa el tax del producto si existe,
      // o IVA 0% (id: 17085) como default para ferretería.
      taxes: [{ id: it.taxId ?? SIIGO_DEFAULT_TAX_ID }],
    })),
    // Las cotizaciones SIIGO no llevan payments — se agregan cuando se convierte a factura.
  };

  // Solo incluir seller si está configurado (campo opcional en SIIGO)
  if (data.sellerId != null) {
    payload.seller = data.sellerId;
  }

  return payload;
}
