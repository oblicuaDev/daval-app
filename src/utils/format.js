export function formatCOP(value) {
  if (value == null || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export const PRODUCT_QUALITIES = [
  { value: 'standard', label: 'Calidad estándar' },
  { value: 'high', label: 'Alta calidad' },
  { value: 'premium', label: 'Calidad premium' },
];
