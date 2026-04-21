import { useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { ShoppingCart, Grid, List, Plus, Minus, X, Package, CheckCircle2, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getPrice, formatCOP, PRODUCT_QUALITIES } from '../../data/mockData';
import productFallback from '../../product.webp';

const CATEGORY_COLORS = [
  'bg-blue-900 text-blue-300',
  'bg-purple-900 text-purple-300',
  'bg-emerald-900 text-emerald-300',
  'bg-orange-900 text-orange-300',
  'bg-pink-900 text-pink-300',
];

function ProductImage({ image, name, className }) {
  return <img src={image || productFallback} alt={name} className={className} />;
}

function getQualityLabel(value) {
  return PRODUCT_QUALITIES.find(q => q.value === value)?.label || 'Calidad estándar';
}

function ProductModal({ product, price, originalPrice, promotion, categoryName, categoryColor, onClose, onAdd }) {
  const [qty, setQty] = useState(1);

  function handleAdd() {
    onAdd(qty);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70" onClick={onClose}>
      <div
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative w-full h-64 bg-gray-900">
          <ProductImage
            image={product.image}
            name={product.name}
            className="w-full h-full object-contain p-4"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-gray-700 rounded-full shadow text-gray-400 hover:text-gray-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
          {product.stock < 20 && product.stock > 0 && (
            <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full font-medium bg-orange-950 text-orange-300">
              Pocas unidades
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-blue-400 font-mono">{product.sku}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-700 text-gray-300">
                  {getQualityLabel(product.quality)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}>
                  {categoryName}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-100 leading-snug">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-gray-400 mt-1">{product.description}</p>
            )}
          </div>

          <div>
            {promotion && (
              <span className="inline-flex items-center gap-1.5 mb-2 px-2 py-1 rounded-full bg-green-950 text-green-300 text-xs font-bold border border-green-800">
                <Tag className="w-3 h-3" />
                {promotion.name}
              </span>
            )}
            {promotion && <p className="text-sm text-gray-500 line-through">{formatCOP(originalPrice)}</p>}
            <p className={`text-2xl font-bold ${promotion ? 'text-green-300' : 'text-blue-400'}`}>{formatCOP(price)}</p>
            <p className="text-xs text-gray-500">por {product.unit}</p>
          </div>

          {/* Quantity + Add */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center border border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:bg-gray-700 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                className="w-14 text-center py-2 text-sm font-medium focus:outline-none border-x border-gray-600 bg-gray-800 text-gray-100"
              />
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:bg-gray-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <ShoppingCart className="w-4 h-4" />
              Agregar a mi cotización
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientCatalog() {
  const context = useOutletContext() || {};
  const location = useLocation();
  const headerSearch = context.search || '';
  const { products, categories, priceLists, promotions, addToCart } = useApp();
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [modalProduct, setModalProduct] = useState(null);
  const [qtyByProduct, setQtyByProduct] = useState({});
  const [showIntro, setShowIntro] = useState(Boolean(location.state?.showCatalogIntro));
  const [loadedFromOrderId, setLoadedFromOrderId] = useState(location.state?.loadedFromOrderId || '');

  const search = headerSearch;
  const priceListId = currentUser?.priceListId || 1;

  function getCategoryName(id) {
    return categories.find(c => c.id === id)?.name || '—';
  }

  function getCategoryColor(id) {
    const idx = categories.findIndex(c => c.id === id);
    return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
  }

  function isPromotionActive(promotion) {
    const now = Date.now();
    const startsAt = promotion.startsAt ? new Date(promotion.startsAt).getTime() : null;
    const endsAt = promotion.endsAt ? new Date(promotion.endsAt).getTime() : null;
    if (startsAt && now < startsAt) return false;
    if (endsAt && now > endsAt) return false;
    if (promotion.scope === 'selected' && !promotion.clientIds?.includes(currentUser?.id)) return false;
    return true;
  }

  function getProductPricing(product) {
    const originalPrice = getPrice(product.basePrice, priceListId, priceLists, product.sku);
    const activePromotions = promotions
      .filter(isPromotionActive)
      .map(promotion => ({
        promotion,
        price: promotion.pricesBySku?.[product.sku],
      }))
      .filter(item => Number.isFinite(item.price) && item.price > 0 && item.price < originalPrice)
      .sort((a, b) => a.price - b.price);

    const bestPromotion = activePromotions[0];
    return {
      originalPrice,
      price: bestPromotion?.price || originalPrice,
      promotion: bestPromotion?.promotion || null,
      hasPromotion: Boolean(bestPromotion),
    };
  }

  function getProductQty(productId) {
    return qtyByProduct[productId] || 1;
  }

  function setProductQty(productId, value) {
    setQtyByProduct(current => ({
      ...current,
      [productId]: Math.max(1, Number(value) || 1),
    }));
  }

  const filtered = products.filter(p => {
    if (!p.active) return false;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'promotions'
      ? getProductPricing(p).hasPromotion
      : selectedCategory
      ? p.categoryId === selectedCategory
      : true;
    const matchQuality = selectedQuality ? (p.quality || 'standard') === selectedQuality : true;
    return matchSearch && matchCat && matchQuality;
  });

  function handleAdd(product, qty) {
    const unitPrice = getProductPricing(product).price;
    addToCart(product, qty, unitPrice);
  }

  const modalPricing = modalProduct ? getProductPricing(modalProduct) : { price: 0, originalPrice: 0, promotion: null };

  return (
    <div className="space-y-5">
      {loadedFromOrderId && (
        <div className="flex items-center justify-between gap-4 bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            El carrito fue prellenado con los productos de la cotización {loadedFromOrderId}.
          </div>
          <button
            type="button"
            onClick={() => setLoadedFromOrderId('')}
            className="text-emerald-400 hover:text-emerald-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-100">Catálogo de Productos</h2>
        <p className="text-sm text-gray-400 mt-1">{filtered.length} productos disponibles</p>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('promotions')}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition border ${
            selectedCategory === 'promotions'
              ? 'bg-green-600 text-white border-green-500'
              : 'bg-green-950 text-green-300 border-green-800 hover:border-green-500 hover:bg-green-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          Promociones
        </button>
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            !selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-blue-500'
          }`}
        >
          Todos
        </button>
        {categories.filter(c => c.active).map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-blue-500'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Calidad</span>
          <select
            value={selectedQuality}
            onChange={event => setSelectedQuality(event.target.value)}
            className="border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-gray-100"
          >
            <option value="">Todas</option>
            {PRODUCT_QUALITIES.map(quality => (
              <option key={quality.value} value={quality.value}>{quality.label}</option>
            ))}
          </select>
        </div>
        <div className="flex border border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(product => {
            const pricing = getProductPricing(product);
            const qty = getProductQty(product.id);
            return (
              <div
                key={product.id}
                onClick={() => setModalProduct(product)}
                className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 flex flex-col hover:shadow-lg hover:border-blue-700 transition-all overflow-hidden cursor-pointer group"
              >
                <div className="relative w-full h-44 overflow-hidden bg-gray-900">
                  <ProductImage
                    image={product.image}
                    name={product.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.stock < 20 && product.stock > 0 && (
                    <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium bg-orange-950 text-orange-300">
                      Pocas unidades
                    </span>
                  )}
                  {pricing.hasPromotion && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-green-600 text-white shadow">
                      <Tag className="w-3 h-3" />
                      Promo
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-blue-400 font-mono mb-1">{product.sku}</p>
                  <h3 className="text-sm font-semibold text-gray-100 mb-3 line-clamp-2 leading-snug flex-1">{product.name}</h3>
                  <span className="w-fit text-xs px-2 py-0.5 rounded-full font-medium bg-gray-700 text-gray-300 mb-3">
                    {getQualityLabel(product.quality)}
                  </span>
                  <div>
                    {pricing.hasPromotion && <p className="text-xs text-gray-500 line-through">{formatCOP(pricing.originalPrice)}</p>}
                    <p className={`text-xl font-bold ${pricing.hasPromotion ? 'text-green-300' : 'text-blue-400'}`}>{formatCOP(pricing.price)}</p>
                    <p className="text-xs text-gray-500">por {product.unit}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2" onClick={event => event.stopPropagation()}>
                    <div className="flex items-center border border-gray-600 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setProductQty(product.id, qty - 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:bg-gray-700 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={event => setProductQty(product.id, event.target.value)}
                        className="w-12 h-8 text-center text-sm font-medium border-x border-gray-600 bg-gray-800 text-gray-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setProductQty(product.id, qty + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:bg-gray-700 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(product, qty)}
                      className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-4 py-16 text-center">
              <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-700">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-16"></th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Producto</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Categoría</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Precio</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Agregar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map(product => {
                  const pricing = getProductPricing(product);
                  const qty = getProductQty(product.id);
                  return (
                    <tr
                      key={product.id}
                      onClick={() => setModalProduct(product)}
                      className="hover:bg-blue-950/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <ProductImage
                          image={product.image}
                          name={product.name}
                          className="w-12 h-12 object-contain rounded-lg bg-gray-900 p-0.5"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-100">{product.name}</p>
                        <p className="text-xs text-blue-400 font-mono">{product.sku}</p>
                        {pricing.hasPromotion && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-bold bg-green-950 text-green-300 border border-green-800">
                            <Tag className="w-3 h-3" />
                            Promo vigente
                          </span>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{getQualityLabel(product.quality)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(product.categoryId)}`}>
                          {getCategoryName(product.categoryId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {pricing.hasPromotion && <p className="text-xs text-gray-500 line-through">{formatCOP(pricing.originalPrice)}</p>}
                        <p className={`text-sm font-bold ${pricing.hasPromotion ? 'text-green-300' : 'text-blue-400'}`}>{formatCOP(pricing.price)}</p>
                        <p className="text-xs text-gray-500">/{product.unit}</p>
                      </td>
                      <td className="px-4 py-3" onClick={event => event.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-gray-600 rounded-lg overflow-hidden">
                            <button type="button" onClick={() => setProductQty(product.id, qty - 1)} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:bg-gray-700 transition">
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={qty}
                              onChange={event => setProductQty(product.id, event.target.value)}
                              className="w-11 h-7 text-center text-xs border-x border-gray-600 bg-gray-800 text-gray-100 focus:outline-none"
                            />
                            <button type="button" onClick={() => setProductQty(product.id, qty + 1)} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:bg-gray-700 transition">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAdd(product, qty)}
                            className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            Agregar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                      No se encontraron productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          price={modalPricing.price}
          originalPrice={modalPricing.originalPrice}
          promotion={modalPricing.promotion}
          categoryName={getCategoryName(modalProduct.categoryId)}
          categoryColor={getCategoryColor(modalProduct.categoryId)}
          onClose={() => setModalProduct(null)}
          onAdd={(qty) => handleAdd(modalProduct, qty)}
        />
      )}

      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6">
            <div className="w-14 h-14 rounded-xl bg-blue-950 text-blue-300 flex items-center justify-center mb-5">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-100 mb-2">Inicia tu pedido desde el catálogo</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Puedes navegar nuestro catálogo y agregar productos a tu carrito. Al confirmar el carrito, recibirás tu cotización automáticamente en tu correo y DAVAL también la recibirá para continuar la gestión del pedido.
            </p>
            <button
              type="button"
              onClick={() => setShowIntro(false)}
              className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Entendido, ver catálogo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
