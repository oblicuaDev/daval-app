import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShoppingCart, Grid, List, Plus, Minus, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getPrice, formatCOP } from '../../data/mockData';

const CATEGORY_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
];

function ProductImage({ image, name, className }) {
  if (image) {
    return <img src={image} alt={name} className={className} />;
  }
  return (
    <div className={`${className} flex items-center justify-center bg-gray-100`}>
      <Package className="w-10 h-10 text-gray-300" />
    </div>
  );
}

function QuantitySelector({ onAdd }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setQty(q => Math.max(1, q - 1))}
        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm"
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        min={1}
        value={qty}
        onChange={e => setQty(Math.max(1, Number(e.target.value)))}
        className="w-12 text-center border border-gray-300 rounded-lg py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        onClick={() => setQty(q => q + 1)}
        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm"
      >
        <Plus className="w-3 h-3" />
      </button>
      <button
        onClick={() => onAdd(qty)}
        className="flex items-center gap-1 px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-medium hover:bg-blue-800 transition whitespace-nowrap"
      >
        <ShoppingCart className="w-3 h-3" />
        Agregar
      </button>
    </div>
  );
}

export default function ClientCatalog() {
  const context = useOutletContext() || {};
  const headerSearch = context.search || '';
  const { products, categories, priceLists, addToCart } = useApp();
  const { currentUser } = useAuth();
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const search = headerSearch || localSearch;
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
    const unitPrice = getPrice(product.basePrice, priceListId, priceLists);
    addToCart(product, qty, unitPrice);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h2>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} productos disponibles</p>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            !selectedCategory ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
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
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition ${viewMode === 'grid' ? 'bg-blue-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition ${viewMode === 'list' ? 'bg-blue-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(product => {
            const price = getPrice(product.basePrice, priceListId, priceLists);
            return (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow overflow-hidden group"
              >
                {/* Product image */}
                <div className="relative w-full h-44 overflow-hidden bg-gray-50">
                  <ProductImage
                    image={product.image}
                    name={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(product.categoryId)}`}>
                    {getCategoryName(product.categoryId)}
                  </span>
                  {product.stock < 20 && product.stock > 0 && (
                    <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                      Pocas unidades
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-gray-400 font-mono mb-1">{product.sku}</p>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug">{product.name}</h3>
                  <p className="text-xs text-gray-400 mb-3 flex-1 line-clamp-2">{product.description}</p>

                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-xl font-bold text-blue-700">{formatCOP(price)}</p>
                      <p className="text-xs text-gray-400">por {product.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Stock</p>
                      <p className={`text-sm font-semibold ${product.stock < 20 ? 'text-orange-600' : 'text-gray-700'}`}>
                        {product.stock}
                      </p>
                    </div>
                  </div>

                  <QuantitySelector onAdd={(qty) => handleAdd(product, qty)} />
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-4 py-16 text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No se encontraron productos</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-16"></th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Producto</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Categoría</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Precio</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Stock</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Agregar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(product => {
                  const price = getPrice(product.basePrice, priceListId, priceLists);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <ProductImage
                          image={product.image}
                          name={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{product.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(product.categoryId)}`}>
                          {getCategoryName(product.categoryId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-blue-700">{formatCOP(price)}</p>
                        <p className="text-xs text-gray-400">/{product.unit}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${product.stock < 20 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <QuantitySelector onAdd={(qty) => handleAdd(product, qty)} />
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                      No se encontraron productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
