import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShoppingCart, Grid, List, Plus, Minus, X, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getPrice, formatCOP } from '../../data/mockData';
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

function ProductModal({ product, price, categoryName, categoryColor, onClose, onAdd }) {
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
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}>
                {categoryName}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-100 leading-snug">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-gray-400 mt-1">{product.description}</p>
            )}
          </div>

          <div>
            <p className="text-2xl font-bold text-blue-400">{formatCOP(price)}</p>
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
  const headerSearch = context.search || '';
  const { products, categories, priceLists, addToCart } = useApp();
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [modalProduct, setModalProduct] = useState(null);

  const search = headerSearch;
  const priceListId = currentUser?.priceListId || 1;

  function getCategoryName(id) {
    return categories.find(c => c.id === id)?.name || '—';
  }

  function getCategoryColor(id) {
    const idx = categories.findIndex(c => c.id === id);
    return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
  }

  const filtered = products.filter(p => {
    if (!p.active) return false;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory ? p.categoryId === selectedCategory : true;
    return matchSearch && matchCat;
  });

  function handleAdd(product, qty) {
    const unitPrice = getPrice(product.basePrice, priceListId, priceLists, product.sku);
    addToCart(product, qty, unitPrice);
  }

  const modalPrice = modalProduct ? getPrice(modalProduct.basePrice, priceListId, priceLists, modalProduct.sku) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Catálogo de Productos</h2>
        <p className="text-sm text-gray-400 mt-1">{filtered.length} productos disponibles</p>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 flex-wrap">
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
            const price = getPrice(product.basePrice, priceListId, priceLists, product.sku);
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
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-blue-400 font-mono mb-1">{product.sku}</p>
                  <h3 className="text-sm font-semibold text-gray-100 mb-3 line-clamp-2 leading-snug flex-1">{product.name}</h3>
                  <div>
                    <p className="text-xl font-bold text-blue-400">{formatCOP(price)}</p>
                    <p className="text-xs text-gray-500">por {product.unit}</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map(product => {
                  const price = getPrice(product.basePrice, priceListId, priceLists, product.sku);
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
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(product.categoryId)}`}>
                          {getCategoryName(product.categoryId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-blue-400">{formatCOP(price)}</p>
                        <p className="text-xs text-gray-500">/{product.unit}</p>
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
          price={modalPrice}
          categoryName={getCategoryName(modalProduct.categoryId)}
          categoryColor={getCategoryColor(modalProduct.categoryId)}
          onClose={() => setModalProduct(null)}
          onAdd={(qty) => handleAdd(modalProduct, qty)}
        />
      )}
    </div>
  );
}
