// =====================
// COMPANIES (EMPRESAS CLIENTE)
// =====================
export const INITIAL_COMPANIES = [
  {
    id: 1,
    name: 'Ferretería El Tornillo Dorado',
    nit: '900.123.456-7',
    email: 'compras@tornillodorado.com',
    phone: '601-234-5678',
    address: 'Cra 10 # 5-23, Bogotá',
    active: true,
    sucursales: [
      { id: 1, name: 'Mostrador Centro', address: 'Cra 10 # 5-23, Bogotá', city: 'Bogotá', routeId: 1, advisorId: 2, active: true },
      { id: 2, name: 'Bodega Chapinero', address: 'Cra 13 # 56-12, Bogotá', city: 'Bogotá', routeId: 1, advisorId: 2, active: true },
    ],
  },
  {
    id: 2,
    name: 'Ferretería Industrial Norte S.A.S.',
    nit: '800.987.654-3',
    email: 'compras@ferreindustrialnorte.com',
    phone: '604-456-7890',
    address: 'Av. El Poblado # 10-50, Medellín',
    active: true,
    sucursales: [
      { id: 1, name: 'Sala de ventas Medellín', address: 'Av. El Poblado # 10-50, Medellín', city: 'Medellín', routeId: null, advisorId: 2, active: true },
      { id: 2, name: 'Centro logístico Itagüí', address: 'Cra 52 # 75-41, Itagüí', city: 'Itagüí', routeId: null, advisorId: 2, active: true },
    ],
  },
  {
    id: 3,
    name: 'Casa Ferretera del Caribe',
    nit: '901.445.228-1',
    email: 'abastecimiento@ferrecaribe.com',
    phone: '605-665-4421',
    address: 'Av. Pedro de Heredia # 32-80, Cartagena',
    active: true,
    sucursales: [
      { id: 1, name: 'Sede Bosque', address: 'Transv. 54 # 21-88, Cartagena', city: 'Cartagena', routeId: null, advisorId: 2, active: true },
      { id: 2, name: 'Sede Manga', address: 'Cra 24 # 28-19, Cartagena', city: 'Cartagena', routeId: null, advisorId: 2, active: true },
      { id: 3, name: 'Bodega Mamonal', address: 'Km 4 Vía Mamonal, Cartagena', city: 'Cartagena', routeId: null, advisorId: 2, active: true },
    ],
  },
  {
    id: 4,
    name: 'Suministros y Herramientas Andina',
    nit: '830.215.772-4',
    email: 'compras@herramientasandina.com',
    phone: '601-742-1188',
    address: 'Av. Boyacá # 72-45, Bogotá',
    active: true,
    sucursales: [
      { id: 1, name: 'Punto Boyacá', address: 'Av. Boyacá # 72-45, Bogotá', city: 'Bogotá', routeId: 1, advisorId: 2, active: true },
      { id: 2, name: 'Punto Fontibón', address: 'Calle 17 # 96-31, Bogotá', city: 'Bogotá', routeId: 1, advisorId: 2, active: true },
    ],
  },
  {
    id: 5,
    name: 'Ferretería Maestro Constructor',
    nit: '901.778.913-5',
    email: 'logistica@maestroconstructor.com',
    phone: '602-388-9021',
    address: 'Calle 5 # 44-21, Cali',
    active: true,
    sucursales: [
      { id: 1, name: 'Sede San Fernando', address: 'Calle 5 # 44-21, Cali', city: 'Cali', routeId: null, advisorId: 2, active: true },
      { id: 2, name: 'Sede Acopi Yumbo', address: 'Cra 35 # 10-120, Yumbo', city: 'Yumbo', routeId: null, advisorId: 2, active: true },
    ],
  },
  {
    id: 6,
    name: 'Depósito Ferremax Mayorista',
    nit: '900.654.331-8',
    email: 'cotizaciones@ferremaxmayorista.com',
    phone: '607-691-3344',
    address: 'Cra 27 # 36-18, Bucaramanga',
    active: true,
    sucursales: [
      { id: 1, name: 'Depósito Principal', address: 'Cra 27 # 36-18, Bucaramanga', city: 'Bucaramanga', routeId: null, advisorId: 2, active: true },
      { id: 2, name: 'Punto Floridablanca', address: 'Anillo Vial # 12-90, Floridablanca', city: 'Floridablanca', routeId: null, advisorId: 2, active: true },
    ],
  },
];

// =====================
// USERS
// =====================
export const INITIAL_USERS = [
  {
    id: 1,
    name: 'Carlos Rodríguez',
    email: 'admin@oblicua.com',
    password: 'admin123',
    role: 'admin',
    initials: 'CR',
  },
  {
    id: 2,
    name: 'Ana Martínez',
    email: 'asesor@oblicua.com',
    password: 'asesor123',
    role: 'advisor',
    branchId: 1,
    initials: 'AM',
  },
  {
    id: 3,
    name: 'Ferretería El Tornillo Dorado',
    email: 'supervisor@oblicua.com',
    password: 'cliente123',
    role: 'client',
    clientRole: 'supervisor',
    priceListId: 2,
    companyId: 1,
    sucursalId: 1,
    contactName: 'Lucía Gómez',
    phone: '311-234-5678',
    address: 'Cra 10 # 5-23, Bogotá',
    initials: 'FT',
    createdAt: '2024-01-15',
  },
  {
    id: 4,
    name: 'Comprador Tornillo Dorado',
    email: 'cliente@oblicua.com',
    password: 'cliente123',
    role: 'client',
    clientRole: 'creador_cotizaciones',
    priceListId: 2,
    companyId: 1,
    sucursalId: 1,
    contactName: 'Pedro Sánchez',
    phone: '311-987-6543',
    address: 'Cra 10 # 5-23, Bogotá',
    initials: 'CT',
    createdAt: '2024-01-20',
  },
];

// =====================
// BRANCHES (SEDES)
// =====================
export const INITIAL_BRANCHES = [
  { id: 1, name: 'Sede Centro', city: 'Bogotá', address: 'Cra 7 # 15-30', phone: '601-234-5678', active: true },
  { id: 2, name: 'Sede Norte', city: 'Bogotá', address: 'Cra 15 # 85-20', phone: '601-345-6789', active: true },
];

// =====================
// DELIVERY ROUTES
// =====================
export const INITIAL_ROUTES = [
  {
    id: 1,
    name: 'Ruta Centro Empresarial',
    day: 'Lunes',
    city: 'Bogotá',
    quadrantId: 'centro',
    quadrantName: 'Cobertura personalizada',
    mapZone: 'Bogotá, Colombia',
    streetFrom: 'Calle 6',
    streetTo: 'Calle 26',
    carreraFrom: 'Carrera 3',
    carreraTo: 'Carrera 14',
    bounds: {
      north: 4.735,
      south: 4.685,
      east: -74.045,
      west: -74.105,
    },
    center: { lat: 4.711, lng: -74.0721 },
    active: true,
  },
];

// =====================
// CATEGORIES
// =====================
export const INITIAL_CATEGORIES = [
  { id: 1, name: 'Papel', description: 'Resmas, pliegos y tipos de papel', active: true },
  { id: 2, name: 'Escritura', description: 'Esferos, marcadores y lápices', active: true },
  { id: 3, name: 'Cartón y Embalaje', description: 'Cajas, cartulinas y embalaje', active: true },
  { id: 4, name: 'Archivadores y Carpetas', description: 'Carpetas, folders y archivadores', active: true },
  { id: 5, name: 'Útiles de Oficina', description: 'Cintas, sobres y accesorios', active: true },
];

// =====================
// PRICE LISTS
// =====================
export const INITIAL_PRICE_LISTS = [
  { id: 1, name: 'Lista A', description: 'Precio público', multiplier: 1.0 },
  { id: 2, name: 'Lista B', description: 'Precio distribuidor', multiplier: 0.90 },
  { id: 3, name: 'Lista C', description: 'Precio mayorista', multiplier: 0.80 },
];

// =====================
// PROMOTIONS
// =====================
export const INITIAL_PROMOTIONS = [];

// =====================
// PRODUCTS
// =====================
export const INITIAL_PRODUCTS = [
  { id: 1, name: 'Resma Papel Bond 75g A4', sku: 'PAP-001', categoryId: 1, description: 'Resma de 500 hojas papel bond 75g tamaño A4', basePrice: 12500, stock: 150, unit: 'Resma', active: true },
  { id: 2, name: 'Resma Papel Bond 75g Carta', sku: 'PAP-002', categoryId: 1, description: 'Resma de 500 hojas papel bond 75g tamaño Carta', basePrice: 11800, stock: 200, unit: 'Resma', active: true },
  { id: 3, name: 'Resma Papel 90g A4', sku: 'PAP-003', categoryId: 1, description: 'Resma de 500 hojas papel 90g tamaño A4, ideal para impresión profesional', basePrice: 18500, stock: 80, unit: 'Resma', active: true },
  { id: 4, name: 'Papel Fotocopia 70g A4', sku: 'PAP-004', categoryId: 1, description: 'Resma de 500 hojas papel económico 70g para fotocopias', basePrice: 9800, stock: 300, unit: 'Resma', active: true },
  { id: 5, name: 'Papel Kraft Pliego', sku: 'PAP-005', categoryId: 1, description: 'Pliego de papel kraft para embalajes y manualidades', basePrice: 850, stock: 500, unit: 'Pliego', active: true },
  { id: 6, name: 'Esfero Azul Caja x12', sku: 'ESC-001', categoryId: 2, description: 'Caja de 12 esferos de tinta azul, punta media', basePrice: 8400, stock: 120, unit: 'Caja', active: true },
  { id: 7, name: 'Esfero Negro Caja x12', sku: 'ESC-002', categoryId: 2, description: 'Caja de 12 esferos de tinta negra, punta media', basePrice: 8400, stock: 95, unit: 'Caja', active: true },
  { id: 8, name: 'Esfero Rojo Caja x12', sku: 'ESC-003', categoryId: 2, description: 'Caja de 12 esferos de tinta roja, punta media', basePrice: 8400, stock: 60, unit: 'Caja', active: true },
  { id: 9, name: 'Marcador Permanente Negro', sku: 'ESC-004', categoryId: 2, description: 'Marcador permanente negro punta gruesa', basePrice: 2800, stock: 200, unit: 'Unidad', active: true },
  { id: 10, name: 'Marcador Tablero Set x5', sku: 'ESC-005', categoryId: 2, description: 'Set de 5 marcadores para tablero en colores surtidos', basePrice: 15000, stock: 45, unit: 'Set', active: true },
  { id: 11, name: 'Caja Cartón 50x30x30 cm', sku: 'CAR-001', categoryId: 3, description: 'Caja de cartón corrugado referencia grande', basePrice: 4500, stock: 300, unit: 'Unidad', active: true },
  { id: 12, name: 'Caja Cartón 40x25x25 cm', sku: 'CAR-002', categoryId: 3, description: 'Caja de cartón corrugado referencia mediana', basePrice: 3200, stock: 400, unit: 'Unidad', active: true },
  { id: 13, name: 'Caja Cartón 30x20x20 cm', sku: 'CAR-003', categoryId: 3, description: 'Caja de cartón corrugado referencia pequeña', basePrice: 2100, stock: 500, unit: 'Unidad', active: true },
  { id: 14, name: 'Cartulina Blanca Pliego', sku: 'CAR-004', categoryId: 3, description: 'Pliego de cartulina blanca calibre 150g', basePrice: 1200, stock: 600, unit: 'Pliego', active: true },
  { id: 15, name: 'Cartulina Colores Paq x10', sku: 'CAR-005', categoryId: 3, description: 'Paquete de 10 pliegos de cartulina en colores surtidos', basePrice: 9500, stock: 80, unit: 'Paquete', active: true },
  { id: 16, name: 'Carpeta Colgante Caja x50', sku: 'ARC-001', categoryId: 4, description: 'Caja de 50 carpetas colgantes para archivador', basePrice: 32000, stock: 40, unit: 'Caja', active: true },
  { id: 17, name: 'Folder Carta Paq x50', sku: 'ARC-002', categoryId: 4, description: 'Paquete de 50 folders tamaño carta', basePrice: 18500, stock: 75, unit: 'Paquete', active: true },
  { id: 18, name: 'Archivador AZ Lomo 7cm', sku: 'ARC-003', categoryId: 4, description: 'Archivador de palanca lomo 7 cm, varios colores', basePrice: 14500, stock: 60, unit: 'Unidad', active: true },
  { id: 19, name: 'Cinta Adhesiva Transparente', sku: 'UTL-001', categoryId: 5, description: 'Rollo de cinta adhesiva transparente 48mm x 50m', basePrice: 4200, stock: 180, unit: 'Rollo', active: true },
  { id: 20, name: 'Sobre Manila Paq x100', sku: 'UTL-002', categoryId: 5, description: 'Paquete de 100 sobres manila tamaño oficio', basePrice: 12000, stock: 90, unit: 'Paquete', active: true },
];

// =====================
// ORDER STATUSES
// =====================
export const ORDER_STATUSES = ['Pendiente', 'Validar disponibilidad', 'Alistamiento', 'En Ruta', 'Entregado'];

export const STATUS_STYLES = {
  'Pendiente por aprobar': { bg: 'bg-rose-950', text: 'text-rose-300', border: 'border-rose-800' },
  'Pendiente': { bg: 'bg-yellow-950', text: 'text-yellow-300', border: 'border-yellow-800' },
  'Validar disponibilidad': { bg: 'bg-blue-950', text: 'text-blue-300', border: 'border-blue-800' },
  'Alistamiento': { bg: 'bg-purple-950', text: 'text-purple-300', border: 'border-purple-800' },
  'En Ruta': { bg: 'bg-orange-950', text: 'text-orange-300', border: 'border-orange-800' },
  'Entregado': { bg: 'bg-green-950', text: 'text-green-300', border: 'border-green-800' },
};

// =====================
// ORDERS
// =====================
export const INITIAL_ORDERS = [
  {
    id: 'COT-001',
    clientId: 3,
    requestedById: 3,
    requestedByName: 'Ferretería El Tornillo Dorado',
    companyId: 1,
    sucursalId: 1,
    sucursalName: 'Mostrador Centro',
    advisorId: 2,
    status: 'Entregado',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-12',
    carrier: 'TCC',
    items: [
      { productId: 1, productName: 'Resma Papel Bond 75g A4', quantity: 10, unitPrice: 11250, unit: 'Resma' },
      { productId: 6, productName: 'Esfero Azul Caja x12', quantity: 5, unitPrice: 7560, unit: 'Caja' },
    ],
    notes: 'Entrega urgente solicitada',
    total: 150300,
    comments: [
      { id: 'c1', authorId: 2, authorName: 'Ana Martínez', authorRole: 'advisor', text: 'Cotización recibida y validada en bodega. Se procede con alistamiento.', createdAt: '2024-02-10T10:30:00' },
      { id: 'c2', authorId: 2, authorName: 'Ana Martínez', authorRole: 'advisor', text: 'Cotización despachada con TCC. Guía #TCC-2024-88321.', createdAt: '2024-02-12T08:15:00' },
    ],
    attachments: [
      { id: 'a1', name: 'remision-COT-001.pdf', size: 142000, type: 'application/pdf', uploadedBy: 'Ana Martínez', uploadedAt: '2024-02-12T08:20:00' },
    ],
  },
  {
    id: 'COT-002',
    clientId: 3,
    requestedById: 3,
    requestedByName: 'Ferretería El Tornillo Dorado',
    companyId: 1,
    sucursalId: 1,
    sucursalName: 'Mostrador Centro',
    advisorId: 2,
    status: 'En Ruta',
    createdAt: '2024-02-20',
    updatedAt: '2024-02-21',
    carrier: 'Envia',
    items: [
      { productId: 2, productName: 'Resma Papel Bond 75g Carta', quantity: 5, unitPrice: 10620, unit: 'Resma' },
      { productId: 11, productName: 'Caja Cartón 50x30x30 cm', quantity: 20, unitPrice: 4050, unit: 'Unidad' },
    ],
    notes: '',
    total: 134100,
    comments: [
      { id: 'c3', authorId: 2, authorName: 'Ana Martínez', authorRole: 'advisor', text: 'Cotización alistada. Sale en ruta con Envia hoy.', createdAt: '2024-02-21T09:00:00' },
    ],
    attachments: [],
  },
  {
    id: 'COT-003',
    clientId: 3,
    requestedById: 3,
    requestedByName: 'Ferretería El Tornillo Dorado',
    companyId: 1,
    sucursalId: 1,
    sucursalName: 'Mostrador Centro',
    advisorId: 2,
    status: 'Alistamiento',
    createdAt: '2024-02-28',
    updatedAt: '2024-03-01',
    carrier: null,
    items: [
      { productId: 3, productName: 'Resma Papel 90g A4', quantity: 8, unitPrice: 16650, unit: 'Resma' },
      { productId: 16, productName: 'Carpeta Colgante Caja x50', quantity: 2, unitPrice: 28800, unit: 'Caja' },
    ],
    notes: 'Pedir factura',
    total: 190800,
    comments: [],
    attachments: [],
  },
  {
    id: 'COT-004',
    clientId: 3,
    requestedById: 3,
    requestedByName: 'Ferretería El Tornillo Dorado',
    companyId: 1,
    sucursalId: 1,
    sucursalName: 'Mostrador Centro',
    advisorId: 2,
    status: 'Pendiente',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
    carrier: null,
    items: [
      { productId: 1, productName: 'Resma Papel Bond 75g A4', quantity: 20, unitPrice: 11250, unit: 'Resma' },
      { productId: 9, productName: 'Marcador Permanente Negro', quantity: 30, unitPrice: 2520, unit: 'Unidad' },
      { productId: 19, productName: 'Cinta Adhesiva Transparente', quantity: 10, unitPrice: 3780, unit: 'Rollo' },
    ],
    notes: 'Para reabastecimiento mensual',
    total: 338700,
    comments: [],
    attachments: [],
  },
  {
    id: 'COT-005',
    clientId: 4,
    requestedById: 4,
    requestedByName: 'Comprador Tornillo Dorado',
    companyId: 1,
    sucursalId: 1,
    sucursalName: 'Mostrador Centro',
    advisorId: null,
    status: 'Pendiente por aprobar',
    createdAt: '2024-03-05',
    updatedAt: '2024-03-05',
    carrier: null,
    items: [
      { productId: 6, productName: 'Esfero Azul Caja x12', quantity: 10, unitPrice: 7560, unit: 'Caja' },
      { productId: 17, productName: 'Folder Carta Paq x50', quantity: 4, unitPrice: 16650, unit: 'Paquete' },
    ],
    notes: 'Cotización de reposición mensual de escritura',
    total: 142200,
    comments: [],
    attachments: [],
  },
];

// Helper: get price for a product given a priceListId
export function getPrice(basePrice, priceListId, priceLists, sku = '') {
  const list = priceLists.find(pl => pl.id === priceListId);
  if (!list) return basePrice;
  const exactPrice = list.pricesBySku?.[sku];
  if (Number.isFinite(exactPrice)) return exactPrice;
  return Math.round(basePrice * (list.multiplier || 1));
}

// Format currency COP
export function formatCOP(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}
