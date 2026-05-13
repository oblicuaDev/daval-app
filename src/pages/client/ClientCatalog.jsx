import { useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import {
  ShoppingCart,
  Grid,
  List,
  Plus,
  Minus,
  X,
  Package,
  CheckCircle2,
  Tag,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useProducts } from "../../hooks/useProducts.js";
import { useCategories } from "../../hooks/useCategories.js";
import { formatCOP, PRODUCT_QUALITIES } from "../../utils/format.js";
import productFallback from "../../product.webp";

const CATEGORY_COLORS = [
  "bg-brand-900/50 text-brand-300 border-brand-800/40",
  "bg-purple-900/50 text-purple-300 border-purple-800/40",
  "bg-emerald-900/50 text-emerald-300 border-emerald-800/40",
  "bg-orange-900/50 text-orange-300 border-orange-800/40",
  "bg-pink-900/50 text-pink-300 border-pink-800/40",
  "bg-cyan-900/50 text-cyan-300 border-cyan-800/40",
];

function ProductImage({ image, name, className }) {
  return (
    <img
      src={image || productFallback}
      alt={name}
      className={className}
      loading="lazy"
    />
  );
}

function getQualityLabel(value) {
  return PRODUCT_QUALITIES.find((q) => q.value === value)?.label || "Estándar";
}

/* ── Skeleton card ──────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-44 rounded-none" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-2.5 w-16 rounded" />
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="skeleton h-5 w-24 rounded mt-2" />
        <div className="skeleton h-8 w-full rounded-lg mt-3" />
      </div>
    </div>
  );
}

/* ── Empty state ────────────────────────────────── */
function EmptyState({ hasFilters }) {
  return (
    <div className="col-span-full py-20 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
        {hasFilters ? (
          <Search className="w-7 h-7 text-zinc-700" />
        ) : (
          <Package className="w-7 h-7 text-zinc-700" />
        )}
      </div>
      <p className="text-sm font-medium text-zinc-400">
        {hasFilters ? "Sin resultados" : "Catálogo vacío"}
      </p>
      <p className="text-xs text-zinc-600 mt-1">
        {hasFilters
          ? "Intenta con otros filtros o términos de búsqueda"
          : "No hay productos disponibles en este momento"}
      </p>
    </div>
  );
}

/* ── Product Detail Modal ───────────────────────── */
function ProductModal({
  product,
  price,
  originalPrice,
  promotion,
  categoryName,
  categoryColor,
  onClose,
  onAdd,
}) {
  const [qty, setQty] = useState(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-modal w-full sm:max-w-md overflow-hidden animate-slide-up sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative w-full h-56 bg-zinc-950 flex items-center justify-center">
          <ProductImage
            image={product.imageUrl}
            name={product.name}
            className="h-full w-full object-contain p-6"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {product.stock < 20 && product.stock > 0 && (
            <span className="absolute top-3 left-3 badge bg-orange-950/80 text-orange-300 border border-orange-800/40 text-[10px]">
              Pocas unidades
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-brand-400 font-mono font-semibold tracking-wider">
                {product.sku}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="badge bg-zinc-800/70 text-zinc-400 border border-zinc-700/40 text-[10px]">
                  {getQualityLabel(product.quality)}
                </span>
                <span className={`badge border text-[10px] ${categoryColor}`}>
                  {categoryName}
                </span>
              </div>
            </div>
            <h3 className="text-base font-semibold text-zinc-50 leading-snug">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div>
            {promotion && (
              <span className="inline-flex items-center gap-1 mb-2 badge bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[10px]">
                <Tag className="w-3 h-3" />
                {promotion.name}
              </span>
            )}
            {promotion && (
              <p className="text-xs text-zinc-600 line-through tabular-nums">
                {formatCOP(originalPrice)}
              </p>
            )}
            <p
              className={`text-2xl font-bold tabular-nums ${promotion ? "text-emerald-400" : "text-brand-400"}`}
            >
              {formatCOP(price)}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">por {product.unit}</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-14 text-center py-2 text-sm font-semibold border-x border-zinc-700 bg-zinc-900 text-zinc-50 focus:outline-none tabular-nums"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => {
                onAdd(qty);
                onClose();
              }}
              className="btn-primary flex-1 py-2.5 text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────── */
export default function ClientCatalog() {
  const context = useOutletContext() || {};
  const location = useLocation();
  const headerSearch = context.search || "";
  const { addToCart } = useApp();

  const { data: products = [], isLoading: productsLoading } = useProducts({ active: true });
  const { data: categories = [] } = useCategories();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [modalProduct, setModalProduct] = useState(null);
  const [qtyByProduct, setQtyByProduct] = useState({});
  const [showIntro, setShowIntro] = useState(
    Boolean(location.state?.showCatalogIntro),
  );
  const [loadedFromOrderId, setLoadedFromOrderId] = useState(
    location.state?.loadedFromOrderId || "",
  );

  function getCategoryName(id) {
    return categories.find((c) => c.id === id)?.name || "—";
  }
  function getCategoryColor(id) {
    const idx = categories.findIndex((c) => c.id === id);
    return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
  }

  // Backend resuelve precios — finalPrice = min(promo, lista)
  function getProductPricing(product) {
    const hasPromotion = product.promotionPrice != null && product.promotionPrice < product.priceListPrice;
    return {
      price: product.finalPrice ?? product.basePrice,
      originalPrice: product.priceListPrice ?? product.basePrice,
      hasPromotion,
      promotion: hasPromotion ? { name: 'Promoción vigente' } : null,
    };
  }
  function getProductQty(id) {
    return qtyByProduct[id] || 1;
  }
  function setProductQty(id, value) {
    setQtyByProduct((cur) => ({
      ...cur,
      [id]: Math.max(1, Number(value) || 1),
    }));
  }
  function handleAdd(product, qty) {
    addToCart(
      { id: product.id, name: product.name, unit: product.unit },
      qty,
      getProductPricing(product).price
    );
  }

  const hasActiveFilters = headerSearch || selectedCategory || selectedQuality;
  const filtered = products.filter((p) => {
    const s = headerSearch.toLowerCase();
    const matchSearch =
      !s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s);
    const matchCat =
      selectedCategory === "promotions"
        ? getProductPricing(p).hasPromotion
        : selectedCategory
          ? p.categoryId === selectedCategory
          : true;
    const matchQ =
      !selectedQuality || (p.quality || "standard") === selectedQuality;
    return matchSearch && matchCat && matchQ;
  });

  const modalPricing = modalProduct
    ? getProductPricing(modalProduct)
    : { price: 0, originalPrice: 0, promotion: null };

  return (
    <div className="space-y-5">
      {/* Re-order banner */}
      {loadedFromOrderId && (
        <div className="flex items-center justify-between gap-3 bg-emerald-950/50 border border-emerald-800/40 rounded-xl px-4 py-2.5 animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            Carrito prellenado con los productos de la cotización{" "}
            {loadedFromOrderId}
          </div>
          <button
            onClick={() => setLoadedFromOrderId("")}
            className="text-emerald-600 hover:text-emerald-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50 tracking-tight">
            Catálogo
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            {filtered.length} producto{filtered.length !== 1 ? "s" : ""}{" "}
            disponible{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-all duration-150 ${viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-600 hover:text-zinc-300"}`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-all duration-150 ${viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-600 hover:text-zinc-300"}`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Promotions chip */}
        <button
          onClick={() =>
            setSelectedCategory(
              selectedCategory === "promotions" ? null : "promotions",
            )
          }
          className={`badge border text-xs px-3 py-1.5 cursor-pointer transition-all duration-150 ${
            selectedCategory === "promotions"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:border-emerald-600/60"
          }`}
        >
          <Tag className="w-3 h-3" />
          Promociones
        </button>

        {/* All */}
        <button
          onClick={() => setSelectedCategory(null)}
          className={`badge border text-xs px-3 py-1.5 cursor-pointer transition-all duration-150 ${
            !selectedCategory
              ? "bg-brand-600 text-white border-brand-500"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          Todos
        </button>

        {/* Category chips */}
        {categories
          .filter((c) => c.active)
          .map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
              }
              className={`badge border text-xs px-3 py-1.5 cursor-pointer transition-all duration-150 ${
                selectedCategory === cat.id
                  ? "bg-brand-600 text-white border-brand-500"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              {cat.name}
            </button>
          ))}

        {/* Quality filter */}
        {PRODUCT_QUALITIES.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <SlidersHorizontal className="w-3 h-3 text-zinc-600" />
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500/60 transition-colors hover:border-zinc-700 cursor-pointer"
            >
              <option value="">Calidad: Todas</option>
              {PRODUCT_QUALITIES.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Grid View ────────────────────────────── */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {productsLoading ? (
            Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState hasFilters={Boolean(hasActiveFilters)} />
          ) : (
            filtered.map((product) => {
              const pricing = getProductPricing(product);
              const qty = getProductQty(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => setModalProduct(product)}
                  className="card flex flex-col overflow-hidden cursor-pointer group hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-200"
                >
                  {/* Image */}
                  <div className="relative w-full h-40 bg-zinc-950/50 overflow-hidden">
                    <ProductImage
                      image={product.imageUrl}
                      name={product.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    />
                    {pricing.hasPromotion && (
                      <span className="absolute top-2 left-2 badge bg-emerald-600 text-white border-0 text-[10px]">
                        <Tag className="w-2.5 h-2.5" />
                        Promo
                      </span>
                    )}
                    {product.stock < 20 && product.stock > 0 && (
                      <span className="absolute top-2 right-2 badge bg-orange-950/80 text-orange-300 border border-orange-800/40 text-[10px]">
                        Pocas
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <span className="text-[10px] text-brand-500 font-mono font-semibold tracking-wider mb-1">
                      {product.sku}
                    </span>
                    <h3 className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-snug flex-1 mb-2">
                      {product.name}
                    </h3>

                    <div className="mb-2.5">
                      {pricing.hasPromotion && (
                        <p className="text-[10px] text-zinc-600 line-through tabular-nums">
                          {formatCOP(pricing.originalPrice)}
                        </p>
                      )}
                      <p
                        className={`text-base font-bold tabular-nums leading-tight ${pricing.hasPromotion ? "text-emerald-400" : "text-brand-400"}`}
                      >
                        {formatCOP(pricing.price)}
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        /{product.unit}
                      </p>
                    </div>

                    {/* Add controls */}
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center bg-zinc-950/60 border border-zinc-800 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setProductQty(product.id, qty - 1)}
                          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={qty}
                          onChange={(e) =>
                            setProductQty(product.id, e.target.value)
                          }
                          className="w-9 h-7 text-center text-xs font-semibold border-x border-zinc-800 bg-transparent text-zinc-100 focus:outline-none tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => setProductQty(product.id, qty + 1)}
                          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdd(product, qty)}
                        className="flex-1 h-7 flex items-center justify-center gap-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[10px] font-semibold transition-all duration-150 active:scale-[0.97]"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── List View ────────────────────────────── */}
      {viewMode === "list" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="table-head-cell w-14" />
                  <th className="table-head-cell">Producto</th>
                  <th className="table-head-cell hidden sm:table-cell">
                    Categoría
                  </th>
                  <th className="table-head-cell">Precio</th>
                  <th className="table-head-cell">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <EmptyState hasFilters={Boolean(hasActiveFilters)} />
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => {
                    const pricing = getProductPricing(product);
                    const qty = getProductQty(product.id);
                    return (
                      <tr
                        key={product.id}
                        onClick={() => setModalProduct(product)}
                        className="hover:bg-zinc-800/25 transition-colors duration-150 cursor-pointer"
                      >
                        <td className="table-cell">
                          <ProductImage
                            image={product.imageUrl}
                            name={product.name}
                            className="w-10 h-10 object-contain rounded-lg bg-zinc-950 p-0.5"
                          />
                        </td>
                        <td className="table-cell">
                          <p className="text-xs font-semibold text-zinc-100">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-brand-500 font-mono mt-0.5">
                            {product.sku}
                          </p>
                          {pricing.hasPromotion && (
                            <span className="inline-flex items-center gap-1 mt-1 badge bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 text-[10px]">
                              <Tag className="w-2.5 h-2.5" /> Promo vigente
                            </span>
                          )}
                        </td>
                        <td className="table-cell hidden sm:table-cell">
                          <span
                            className={`badge border text-[10px] ${getCategoryColor(product.categoryId)}`}
                          >
                            {getCategoryName(product.categoryId)}
                          </span>
                        </td>
                        <td className="table-cell">
                          {pricing.hasPromotion && (
                            <p className="text-[10px] text-zinc-600 line-through tabular-nums">
                              {formatCOP(pricing.originalPrice)}
                            </p>
                          )}
                          <p
                            className={`text-sm font-bold tabular-nums ${pricing.hasPromotion ? "text-emerald-400" : "text-brand-400"}`}
                          >
                            {formatCOP(pricing.price)}
                          </p>
                          <p className="text-[10px] text-zinc-600">
                            /{product.unit}
                          </p>
                        </td>
                        <td
                          className="table-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  setProductQty(product.id, qty - 1)
                                }
                                className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) =>
                                  setProductQty(product.id, e.target.value)
                                }
                                className="w-9 h-7 text-center text-xs border-x border-zinc-800 bg-transparent text-zinc-100 focus:outline-none tabular-nums"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setProductQty(product.id, qty + 1)
                                }
                                className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAdd(product, qty)}
                              className="h-7 px-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[10px] font-semibold transition-all duration-150 active:scale-[0.97]"
                            >
                              Agregar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product modal */}
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

      {/* Intro modal */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-modal p-6 animate-scale-in">
            <div className="w-12 h-12 rounded-xl bg-brand-900/60 border border-brand-800/40 flex items-center justify-center mb-4">
              <ShoppingCart className="w-6 h-6 text-brand-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-50 mb-2 tracking-tight">
              Inicia tu cotización
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Navega el catálogo y agrega productos a tu carrito. Al confirmar,
              recibirás la cotización y DAVAL la procesará para tu próxima ruta.
            </p>
            <button
              type="button"
              onClick={() => setShowIntro(false)}
              className="btn-primary w-full mt-5 text-sm"
            >
              Ver catálogo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
