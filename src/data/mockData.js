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
    email: 'compras@oblicua.com',
    password: 'cliente123',
    role: 'client',
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
    cutoffTime: '16:00',
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
  { id: 1, name: 'Herramientas Manuales', description: 'Martillos, alicates, llaves, destornilladores y herramientas de medición', active: true },
  { id: 2, name: 'Tornillería y Fijación', description: 'Tornillos, puntillas, chazos, abrazaderas y elementos de fijación', active: true },
  { id: 3, name: 'Construcción y Obra', description: 'Cemento, estuco, arena, bloques y discos de corte', active: true },
  { id: 4, name: 'Seguridad Industrial', description: 'Guantes, gafas, cascos y elementos de protección personal', active: true },
  { id: 5, name: 'Pinturas y Adhesivos', description: 'Cintas, siliconas, sellantes, pinturas y complementos', active: true },
];

export const PRODUCT_QUALITIES = [
  { value: 'standard', label: 'Calidad estándar' },
  { value: 'high', label: 'Alta calidad' },
  { value: 'premium', label: 'Calidad premium' },
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
export const INITIAL_PROMOTIONS = [
  {
    id: 1,
    name: 'Promocion Ferretera Abril',
    description: 'Promocion vigente para productos seleccionados del catalogo ferretero',
    scope: 'all',
    clientIds: [3, 4],
    startsAt: '2026-04-01T00:00',
    endsAt: '2026-05-31T23:59',
    fileName: 'promocion-ferretera-abril.csv',
    fileSize: 3840,
    itemCount: 6,
    pricesBySku: {
      'HER-001': 29900,
      'TOR-001': 21900,
      'CON-001': 31900,
      'SEG-002': 6900,
      'PIN-002': 10900,
      'HER-005': 9900,
    },
    updatedAt: '2026-04-01T08:00:00',
  },
];

// =====================
// PRODUCTS
// =====================
export const INITIAL_PRODUCTS = [
  { id: 1, name: 'Martillo de uña 16 oz mango fibra', sku: 'HER-001', categoryId: 1, quality: 'premium', description: 'Martillo de uña para carpintería y uso general con mango antideslizante', basePrice: 38500, stock: 85, unit: 'Unidad', active: true },
  { id: 2, name: 'Alicate universal 8 pulgadas', sku: 'HER-002', categoryId: 1, quality: 'high', description: 'Alicate universal en acero al carbono para corte y sujeción', basePrice: 32500, stock: 110, unit: 'Unidad', active: true },
  { id: 3, name: 'Llave inglesa ajustable 10 pulgadas', sku: 'HER-003', categoryId: 1, quality: 'premium', description: 'Llave ajustable cromada para trabajos de mantenimiento y plomería', basePrice: 42000, stock: 70, unit: 'Unidad', active: true },
  { id: 4, name: 'Destornillador Phillips #2', sku: 'HER-004', categoryId: 1, quality: 'standard', description: 'Destornillador punta Phillips con mango ergonómico', basePrice: 9500, stock: 180, unit: 'Unidad', active: true },
  { id: 5, name: 'Flexómetro 5 m cinta metálica', sku: 'HER-005', categoryId: 1, quality: 'high', description: 'Flexómetro de 5 metros con seguro y carcasa resistente', basePrice: 14500, stock: 160, unit: 'Unidad', active: true },
  { id: 6, name: 'Tornillo drywall 1 pulgada caja x500', sku: 'TOR-001', categoryId: 2, quality: 'standard', description: 'Caja de tornillos drywall punta fina fosfatados', basePrice: 28000, stock: 95, unit: 'Caja', active: true },
  { id: 7, name: 'Tornillo autoperforante 1/2 caja x1000', sku: 'TOR-002', categoryId: 2, quality: 'high', description: 'Tornillo autoperforante para lámina y estructuras livianas', basePrice: 36000, stock: 72, unit: 'Caja', active: true },
  { id: 8, name: 'Puntilla de acero 2 pulgadas', sku: 'TOR-003', categoryId: 2, quality: 'standard', description: 'Puntilla de acero para carpintería y obra liviana', basePrice: 7200, stock: 240, unit: 'Kg', active: true },
  { id: 9, name: 'Chazo plástico 1/4 paquete x100', sku: 'TOR-004', categoryId: 2, quality: 'standard', description: 'Chazos plásticos para fijación en muro, paquete por 100 unidades', basePrice: 12500, stock: 130, unit: 'Paquete', active: true },
  { id: 10, name: 'Abrazadera metálica 1/2 paquete x50', sku: 'TOR-005', categoryId: 2, quality: 'high', description: 'Abrazaderas metálicas para tubería y cableado', basePrice: 18500, stock: 65, unit: 'Paquete', active: true },
  { id: 11, name: 'Cemento gris 50 kg', sku: 'CON-001', categoryId: 3, quality: 'standard', description: 'Bulto de cemento gris de uso general para construcción', basePrice: 38500, stock: 210, unit: 'Bulto', active: true },
  { id: 12, name: 'Estuco plástico cuñete 5 galones', sku: 'CON-002', categoryId: 3, quality: 'premium', description: 'Estuco plástico listo para aplicar en interiores', basePrice: 68000, stock: 48, unit: 'Cuñete', active: true },
  { id: 13, name: 'Arena lavada saco 40 kg', sku: 'CON-003', categoryId: 3, quality: 'standard', description: 'Arena lavada empacada para mezcla y acabados', basePrice: 9800, stock: 320, unit: 'Saco', active: true },
  { id: 14, name: 'Bloque #5 arcilla estructural', sku: 'CON-004', categoryId: 3, quality: 'standard', description: 'Bloque de arcilla para mampostería y cerramientos', basePrice: 2200, stock: 850, unit: 'Unidad', active: true },
  { id: 15, name: 'Disco diamantado 4 1/2 pulgadas', sku: 'CON-005', categoryId: 3, quality: 'premium', description: 'Disco diamantado para corte de cerámica, concreto y ladrillo', basePrice: 24500, stock: 90, unit: 'Unidad', active: true },
  { id: 16, name: 'Guante de carnaza reforzado', sku: 'SEG-001', categoryId: 4, quality: 'standard', description: 'Par de guantes de carnaza para manejo de carga y trabajo pesado', basePrice: 11800, stock: 140, unit: 'Par', active: true },
  { id: 17, name: 'Gafas de seguridad transparentes', sku: 'SEG-002', categoryId: 4, quality: 'high', description: 'Gafas livianas de protección visual para obra y taller', basePrice: 9500, stock: 125, unit: 'Unidad', active: true },
  { id: 18, name: 'Casco de seguridad amarillo', sku: 'SEG-003', categoryId: 4, quality: 'premium', description: 'Casco dieléctrico con tafilete ajustable para obra', basePrice: 28500, stock: 75, unit: 'Unidad', active: true },
  { id: 19, name: 'Cinta aislante negra 18 m', sku: 'PIN-001', categoryId: 5, quality: 'standard', description: 'Rollo de cinta aislante para instalaciones eléctricas', basePrice: 4200, stock: 220, unit: 'Rollo', active: true },
  { id: 20, name: 'Silicona multipropósito 280 ml', sku: 'PIN-002', categoryId: 5, quality: 'high', description: 'Cartucho de silicona transparente para sellado general', basePrice: 14500, stock: 115, unit: 'Cartucho', active: true },
];

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
    siigoUrl: '',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-12',
    carrier: 'TCC',
    items: [
      { productId: 1, productName: 'Martillo de uña 16 oz mango fibra', quantity: 10, unitPrice: 34650, unit: 'Unidad' },
      { productId: 6, productName: 'Tornillo drywall 1 pulgada caja x500', quantity: 5, unitPrice: 25200, unit: 'Caja' },
    ],
    notes: 'Entrega urgente solicitada',
    total: 472500,
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
    siigoUrl: '',
    createdAt: '2024-02-20',
    updatedAt: '2024-02-21',
    carrier: 'Envia',
    items: [
      { productId: 2, productName: 'Alicate universal 8 pulgadas', quantity: 5, unitPrice: 29250, unit: 'Unidad' },
      { productId: 11, productName: 'Cemento gris 50 kg', quantity: 20, unitPrice: 34650, unit: 'Bulto' },
    ],
    notes: 'Entrega coordinada para obra en curso.',
    total: 839250,
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
    siigoUrl: '',
    createdAt: '2024-02-28',
    updatedAt: '2024-03-01',
    carrier: null,
    items: [
      { productId: 3, productName: 'Llave inglesa ajustable 10 pulgadas', quantity: 8, unitPrice: 37800, unit: 'Unidad' },
      { productId: 16, productName: 'Guante de carnaza reforzado', quantity: 2, unitPrice: 10620, unit: 'Par' },
    ],
    notes: 'Pedir factura con datos completos de la empresa.',
    total: 323640,
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
    siigoUrl: '',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
    carrier: null,
    items: [
      { productId: 1, productName: 'Martillo de uña 16 oz mango fibra', quantity: 20, unitPrice: 34650, unit: 'Unidad' },
      { productId: 9, productName: 'Chazo plástico 1/4 paquete x100', quantity: 30, unitPrice: 11250, unit: 'Paquete' },
      { productId: 19, productName: 'Cinta Adhesiva Transparente', quantity: 10, unitPrice: 3780, unit: 'Rollo' },
    ],
    notes: 'Para reabastecimiento mensual de ferretería.',
    total: 1068300,
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
    advisorId: 2,
    siigoUrl: '',
    createdAt: '2024-03-05',
    updatedAt: '2024-03-05',
    carrier: null,
    items: [
      { productId: 6, productName: 'Tornillo drywall 1 pulgada caja x500', quantity: 10, unitPrice: 25200, unit: 'Caja' },
      { productId: 17, productName: 'Gafas de seguridad transparentes', quantity: 4, unitPrice: 8550, unit: 'Unidad' },
    ],
    notes: 'Cotización de reposición mensual de fijaciones y seguridad.',
    total: 286200,
    comments: [],
    attachments: [],
  },
  {
    id: 'COT-006',
    clientId: 4,
    requestedById: 4,
    requestedByName: 'Comprador Tornillo Dorado',
    companyId: 1,
    sucursalId: 1,
    sucursalName: 'Mostrador Centro',
    advisorId: 2,
    siigoUrl: '',
    createdAt: '2024-03-12',
    updatedAt: '2024-03-12',
    carrier: null,
    items: [
      { productId: 1, productName: 'Martillo de uña 16 oz mango fibra', quantity: 12, unitPrice: 34650, unit: 'Unidad' },
      { productId: 7, productName: 'Tornillo autoperforante 1/2 caja x1000', quantity: 6, unitPrice: 32400, unit: 'Caja' },
      { productId: 18, productName: 'Casco de seguridad amarillo', quantity: 8, unitPrice: 25650, unit: 'Unidad' },
    ],
    notes: 'Reposición para mostrador y elementos de obra.',
    total: 815400,
    comments: [],
    attachments: [],
  },
  {
    id: 'COT-007',
    clientId: 4,
    requestedById: 4,
    requestedByName: 'Comprador Tornillo Dorado',
    companyId: 1,
    sucursalId: 1,
    sucursalName: 'Mostrador Centro',
    advisorId: 2,
    siigoUrl: '',
    createdAt: '2024-03-18',
    updatedAt: '2024-03-18',
    carrier: null,
    items: [
      { productId: 11, productName: 'Cemento gris 50 kg', quantity: 30, unitPrice: 34650, unit: 'Bulto' },
      { productId: 12, productName: 'Estuco plástico cuñete 5 galones', quantity: 45, unitPrice: 61200, unit: 'Cuñete' },
      { productId: 19, productName: 'Cinta aislante negra 18 m', quantity: 18, unitPrice: 3780, unit: 'Rollo' },
    ],
    notes: 'Material para acabados y adecuaciones de obra.',
    total: 3861540,
    comments: [],
    attachments: [],
  },
  {
    id: 'COT-008',
    clientId: 4,
    requestedById: 4,
    requestedByName: 'Comprador Tornillo Dorado',
    companyId: 1,
    sucursalId: 1,
    sucursalName: 'Mostrador Centro',
    advisorId: 2,
    siigoUrl: '',
    createdAt: '2024-03-25',
    updatedAt: '2024-03-25',
    carrier: null,
    items: [
      { productId: 6, productName: 'Tornillo drywall 1 pulgada caja x500', quantity: 8, unitPrice: 25200, unit: 'Caja' },
      { productId: 8, productName: 'Puntilla de acero 2 pulgadas', quantity: 3, unitPrice: 6480, unit: 'Kg' },
      { productId: 17, productName: 'Gafas de seguridad transparentes', quantity: 7, unitPrice: 8550, unit: 'Unidad' },
      { productId: 20, productName: 'Silicona multipropósito 280 ml', quantity: 4, unitPrice: 13050, unit: 'Cartucho' },
    ],
    notes: 'Reposición de fijaciones, seguridad y sellantes.',
    total: 333090,
    comments: [],
    attachments: [],
  },
  {
    id: 'COT-009',
    clientId: 3,
    requestedById: 3,
    requestedByName: 'Ferretería El Tornillo Dorado',
    companyId: 1,
    sucursalId: 1,
    sucursalName: 'Mostrador Centro',
    advisorId: 2,
    siigoUrl: '',
    createdAt: '2024-03-28',
    updatedAt: '2024-03-28',
    carrier: null,
    items: [
      { productId: 2, productName: 'Alicate universal 8 pulgadas', quantity: 18, unitPrice: 29250, unit: 'Unidad' },
      { productId: 14, productName: 'Bloque #5 arcilla estructural', quantity: 50, unitPrice: 1980, unit: 'Unidad' },
      { productId: 15, productName: 'Disco diamantado 4 1/2 pulgadas', quantity: 10, unitPrice: 22050, unit: 'Unidad' },
    ],
    notes: 'Solicitud recurrente para herramientas y material de obra.',
    total: 846000,
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
