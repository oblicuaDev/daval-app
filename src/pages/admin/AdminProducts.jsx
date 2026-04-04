import { useState } from 'react';
import { Plus, Search, Pencil, Eye, EyeOff, Upload, X, Filter, ImageIcon, Camera } from 'lucide-react';
import productFallback from '../../product.webp';
import { useApp } from '../../context/AppContext';
import { formatCOP } from '../../data/mockData';

const EMPTY_FORM = {
  name: '', sku: '', categoryId: '', description: '',
  basePrice: '', stock: '', unit: 'Unidad', active: true, image: null,
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const { products, setProducts, categories } = useApp();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [nextId, setNextId] = useState(21);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory ? p.categoryId === Number(filterCategory) : true;
    return matchSearch && matchCat;
  });

  function getCategoryName(id) {
    return categories.find(c => c.id === id)?.name || '—';
  }

  function openCreate() {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      categoryId: String(product.categoryId),
      description: product.description,
      basePrice: String(product.basePrice),
      stock: String(product.stock),
      unit: product.unit,
      active: product.active,
      image: product.image || null,
    });
    setShowModal(true);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target.result }));
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!form.name || !form.sku || !form.categoryId || !form.basePrice) return;
    const payload = {
      ...form,
      categoryId: Number(form.categoryId),
      basePrice: Number(form.basePrice),
      stock: Number(form.stock),
    };
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...payload } : p));
    } else {
      setProducts(prev => [...prev, { id: nextId, ...payload }]);
      setNextId(n => n + 1);
    }
    setShowModal(false);
  }

  function toggleActive(id) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h2>
          <p className="text-sm text-gray-500 mt-1">{products.length} productos en total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            <Upload className="w-4 h-4" />
            Importar Excel
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Imagen</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">SKU</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Nombre</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Categoría</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Precio Base</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Stock</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Unidad</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <img
                      src={product.image || productFallback}
                      alt={product.name}
                      className="w-11 h-11 object-cover rounded-lg border border-gray-100"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{product.sku}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800 max-w-xs">
                    <div className="truncate">{product.name}</div>
                    <div className="text-xs text-gray-400 truncate">{product.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                      {getCategoryName(product.categoryId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{formatCOP(product.basePrice)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{product.stock}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(product.id)}
                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        title={product.active ? 'Desactivar' : 'Activar'}
                      >
                        {product.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <Modal title={editProduct ? 'Editar Producto' : 'Nuevo Producto'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className={labelClass}>Imagen del Producto</label>
              <div className="relative group">
                <img
                  src={form.image || productFallback}
                  alt="preview"
                  className="w-full h-44 object-cover rounded-xl border border-gray-200"
                />
                <label className="absolute inset-0 flex flex-col items-center justify-center rounded-xl cursor-pointer bg-black bg-opacity-0 group-hover:bg-opacity-40 transition">
                  <Camera className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition mb-1" />
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                    {form.image ? 'Cambiar imagen' : 'Subir imagen'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, image: null }))}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow text-gray-500 hover:text-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombre *</label>
                <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del producto" />
              </div>
              <div>
                <label className={labelClass}>SKU *</label>
                <input className={inputClass} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="PAP-001" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Centro de costo *</label>
              <select className={inputClass} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">Seleccionar centro de costo</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Descripción</label>
              <textarea className={inputClass} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del producto" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Precio Base (COP) *</label>
                <input className={inputClass} type="number" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Stock</label>
                <input className={inputClass} type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Unidad</label>
                <select className={inputClass} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {['Unidad', 'Resma', 'Caja', 'Paquete', 'Pliego', 'Set', 'Rollo'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
              <label htmlFor="active" className="text-sm text-gray-700">Producto activo</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition">
                {editProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImport && (
        <Modal title="Importar Productos desde Excel" onClose={() => setShowImport(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecciona un archivo Excel (.xlsx) con el formato de productos. Las columnas deben ser: SKU, Nombre, Categoría, Descripción, Precio Base, Stock, Unidad.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition">
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">Arrastra tu archivo aquí o</p>
              <label className="cursor-pointer">
                <span className="text-sm font-medium text-blue-600 hover:text-blue-700">Seleccionar archivo</span>
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" />
              </label>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                Esta es una demostración. El archivo no será procesado realmente.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowImport(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={() => setShowImport(false)} className="flex-1 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition">
                Importar (Demo)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
