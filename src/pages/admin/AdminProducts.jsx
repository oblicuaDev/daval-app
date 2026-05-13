import { useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Eye,
  EyeOff,
  Upload,
  X,
  Filter,
  Camera,
  Link2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import productFallback from "../../product.webp";
import { formatCOP, PRODUCT_QUALITIES } from "../../utils/format.js";
import { productsApi } from "../../api/modules/products";
import { useProducts, useCreateProduct, useUpdateProduct, productKeys } from "../../hooks/useProducts.js";
import { useCategories } from "../../hooks/useCategories.js";

const EMPTY_FORM = {
  name: "",
  sku: "",
  categoryId: "",
  description: "",
  basePrice: "",
  stock: "",
  unit: "Unidad",
  quality: "standard",
  active: true,
  image: null,
  complementaryIds: [],
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useProducts({ active: false });
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterQuality, setFilterQuality] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [crossSearch, setCrossSearch] = useState("");

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory
      ? p.categoryId === Number(filterCategory)
      : true;
    const matchQuality = filterQuality
      ? (p.quality || "standard") === filterQuality
      : true;
    return matchSearch && matchCat && matchQuality;
  });

  function getCategoryName(id) {
    return categories.find((c) => c.id === id)?.name || "—";
  }

  function getQualityName(value) {
    return (
      PRODUCT_QUALITIES.find((q) => q.value === value)?.label ||
      "Calidad estándar"
    );
  }

  function openCreate() {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setUploadError("");
    setCrossSearch("");
    setShowModal(true);
  }

  function openEdit(product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      categoryId: String(product.categoryId),
      description: product.description || "",
      basePrice: String(product.basePrice),
      stock: String(product.stock ?? 0),
      unit: product.unit,
      quality: product.quality || "standard",
      active: product.active !== false,
      image: product.imageUrl || product.image || null,
      complementaryIds: product.complementaryIds || [],
    });
    setImageFile(null);
    setUploadError("");
    setCrossSearch("");
    setShowModal(true);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError("");
    setImageFile(file);
    // Show local preview immediately via FileReader
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, image: ev.target.result }));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.name || !form.sku || !form.categoryId || !form.basePrice) return;

    setUploadError("");

    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        categoryId: Number(form.categoryId),
        description: form.description,
        basePrice: Number(form.basePrice),
        stock: Number(form.stock || 0),
        unit: form.unit,
        quality: form.quality,
        active: form.active,
        complementaryIds: form.complementaryIds || [],
      };

      let savedId = editProduct?.id;
      if (editProduct) {
        await updateProduct.mutateAsync({ id: editProduct.id, body: payload });
      } else {
        const created = await createProduct.mutateAsync(payload);
        savedId = created.id;
      }

      if (imageFile && savedId) {
        await productsApi.uploadImage(savedId, imageFile);
        qc.invalidateQueries({ queryKey: productKeys.all });
      }

      setShowModal(false);
      setImageFile(null);
    } catch (err) {
      if (err?.response?.status === 401) {
        setUploadError("La API respondió 401. Se está perdiendo la sesión.");
        return;
      }
      setUploadError(err?.message || "Error guardando producto");
    }
  }

  async function toggleActive(product) {
    await updateProduct.mutateAsync({ id: product.id, body: { active: !product.active } });
  }

  const saving = createProduct.isPending || updateProduct.isPending;
  const inputClass =
    "w-full border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">
            Catálogo de Productos
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {isLoading ? 'Cargando…' : `${products.length} productos en total`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
          >
            <Upload className="w-4 h-4" />
            Importar Excel
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-9 pr-4 py-2 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 placeholder-gray-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 appearance-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <select
            value={filterQuality}
            onChange={(e) => setFilterQuality(e.target.value)}
            className="px-3 pr-8 py-2 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 appearance-none"
          >
            <option value="">Todas las calidades</option>
            {PRODUCT_QUALITIES.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Imagen
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  SKU
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Nombre
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Categoría
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Calidad
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Precio Base
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Stock
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Unidad
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Estado
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <img
                      src={product.imageUrl || product.image || productFallback}
                      alt={product.name}
                      className="w-11 h-11 object-cover rounded-lg border border-gray-700"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">
                    {product.sku}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-100 max-w-xs">
                    <div className="truncate">{product.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {product.description}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-950 text-blue-300 px-2 py-1 rounded-full font-medium">
                      {getCategoryName(product.categoryId)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full font-medium">
                      {getQualityName(product.quality)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-200">
                    {formatCOP(product.basePrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {product.stock}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {product.unit}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${product.active ? "bg-green-950 text-green-400" : "bg-gray-700 text-gray-400"}`}
                    >
                      {product.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-950 rounded-lg transition"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(product)}
                        className="p-1.5 text-gray-500 hover:text-orange-400 hover:bg-orange-950 rounded-lg transition"
                        title={product.active ? "Desactivar" : "Activar"}
                      >
                        {product.active ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
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
        <Modal
          title={editProduct ? "Editar Producto" : "Nuevo Producto"}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className={labelClass}>Imagen del Producto</label>
              <div className="relative group">
                <img
                  src={form.image || productFallback}
                  alt="preview"
                  className="w-full h-44 object-cover rounded-xl border border-gray-600"
                />
                <label className="absolute inset-0 flex flex-col items-center justify-center rounded-xl cursor-pointer bg-black bg-opacity-0 group-hover:bg-opacity-50 transition">
                  <Camera className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition mb-1" />
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                    {form.image ? "Cambiar imagen" : "Subir imagen"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image: null }))}
                    className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded-full shadow text-gray-400 hover:text-red-400 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombre *</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Nombre del producto"
                />
              </div>
              <div>
                <label className={labelClass}>SKU *</label>
                <input
                  className={inputClass}
                  value={form.sku}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sku: e.target.value }))
                  }
                  placeholder="HER-001"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Categoría *</label>
              <select
                className={inputClass}
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Calidad de producto</label>
              <select
                className={inputClass}
                value={form.quality}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quality: e.target.value }))
                }
              >
                {PRODUCT_QUALITIES.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Descripción</label>
              <textarea
                className={inputClass}
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Descripción del producto"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Precio Base (COP) *</label>
                <input
                  className={inputClass}
                  type="number"
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, basePrice: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Stock</label>
                <input
                  className={inputClass}
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Unidad</label>
                <select
                  className={inputClass}
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                >
                  {[
                    "Unidad",
                    "Caja",
                    "Paquete",
                    "Bulto",
                    "Cuñete",
                    "Saco",
                    "Kg",
                    "Par",
                    "Rollo",
                    "Cartucho",
                  ].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Complementary products */}
            <div>
              <label className={labelClass + " flex items-center gap-1.5"}>
                <Link2 className="w-3.5 h-3.5 text-blue-400" />
                Productos complementarios{" "}
                <span className="text-gray-500 font-normal text-xs">
                  (cross-selling)
                </span>
              </label>

              {form.complementaryIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.complementaryIds.map((id) => {
                    const p = products.find((pr) => pr.id === id);
                    if (!p) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 bg-blue-950 text-blue-300 border border-blue-800 rounded-full px-2 py-0.5 text-xs font-medium"
                      >
                        {p.name}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              complementaryIds: f.complementaryIds.filter(
                                (i) => i !== id,
                              ),
                            }))
                          }
                          className="text-blue-500 hover:text-blue-300 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                <input
                  className={inputClass + " pl-8"}
                  value={crossSearch}
                  onChange={(e) => setCrossSearch(e.target.value)}
                  placeholder="Buscar productos a relacionar..."
                />
              </div>

              {crossSearch.trim() &&
                (() => {
                  const q = crossSearch.toLowerCase();
                  const results = products
                    .filter(
                      (p) =>
                        p.id !== editProduct?.id &&
                        !form.complementaryIds.includes(p.id) &&
                        (p.name.toLowerCase().includes(q) ||
                          p.sku.toLowerCase().includes(q)),
                    )
                    .slice(0, 6);
                  return results.length > 0 ? (
                    <div className="border border-gray-600 rounded-lg mt-1 divide-y divide-gray-700 shadow-sm overflow-hidden">
                      {results.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              complementaryIds: [...f.complementaryIds, p.id],
                            }));
                            setCrossSearch("");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-950 transition"
                        >
                          <img
                            src={p.image || "/product.webp"}
                            alt={p.name}
                            className="w-7 h-7 rounded object-cover flex-shrink-0 border border-gray-600"
                            onError={(e) => {
                              e.target.src = "/product.webp";
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {p.sku}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1.5 px-1">
                      Sin resultados
                    </p>
                  );
                })()}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
                className="rounded"
              />
              <label htmlFor="active" className="text-sm text-gray-300">
                Producto activo
              </label>
            </div>
            {uploadError && (
              <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/40 rounded-lg px-3 py-2">
                {uploadError}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving
                  ? "Guardando…"
                  : editProduct
                    ? "Guardar Cambios"
                    : "Crear Producto"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImport && (
        <Modal
          title="Importar Productos desde Excel"
          onClose={() => setShowImport(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Selecciona un archivo Excel (.xlsx) con el formato de productos.
              Las columnas deben ser: SKU, Nombre, Categoría, Calidad,
              Descripción, Precio Base, Stock, Unidad.
            </p>
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition">
              <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-2">
                Arrastra tu archivo aquí o
              </p>
              <label className="cursor-pointer">
                <span className="text-sm font-medium text-blue-400 hover:text-blue-300">
                  Seleccionar archivo
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
              </label>
            </div>
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                Esta es una demostración. El archivo no será procesado
                realmente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImport(false)}
                className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Importar (Demo)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
