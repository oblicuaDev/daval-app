import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, History, ArrowRight, Eye, X, Package, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useQuotations } from '../../hooks/useQuotations.js';
import { useCompanies } from '../../hooks/useCompanies.js';
import { useRoutes } from '../../hooks/useRoutes.js';
import { formatCOP } from '../../utils/format.js';
import { getRouteCutoffStatus } from '../../utils/routeCutoff';

export default function ClientStart() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { loadCartFromItems } = useApp();
  const { data: quotations = [] } = useQuotations();
  const { data: companies = [] } = useCompanies();
  const { data: routes = [] } = useRoutes();

  const [showPreviousModal, setShowPreviousModal] = useState(false);
  const [previewOrder, setPreviewOrder] = useState(null);

  // Resolve client's route via their branchId
  const clientRoute = useMemo(() => {
    if (!currentUser?.branchId) return null;
    for (const company of companies) {
      const branch = (company.branches || []).find(b => b.id === currentUser.branchId);
      if (branch?.routeId) {
        return routes.find(r => r.id === branch.routeId) || null;
      }
    }
    return null;
  }, [currentUser, companies, routes]);

  const cutoffStatus = getRouteCutoffStatus(clientRoute);

  const previousOrders = useMemo(() => (
    [...quotations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  ), [quotations]);

  function startFromScratch() {
    if (!cutoffStatus.isOpen) return;
    navigate('/cliente/catalogo', { state: { showCatalogIntro: true } });
  }

  function usePreviousOrder(order) {
    if (!cutoffStatus.isOpen) return;
    loadCartFromItems(order.items);
    setShowPreviousModal(false);
    navigate('/cliente/catalogo', { state: { loadedFromOrderId: order.id } });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-100">¿Cómo quieres iniciar tu solicitud?</h2>
        <p className="text-sm text-gray-400 mt-2">
          Elige si deseas construir una cotización desde cero o reutilizar una cotización anterior para ahorrar tiempo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          type="button"
          onClick={startFromScratch}
          disabled={!cutoffStatus.isOpen}
          className="text-left bg-gray-800 border border-gray-700 hover:border-blue-600 rounded-xl p-6 transition group disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-gray-700"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-950 text-blue-300 flex items-center justify-center mb-5">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-100 mb-2">Iniciar un pedido nuevo desde cero</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Navega el catálogo de DAVAL, agrega productos al carrito y confirma tu solicitud de cotización.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 group-hover:text-blue-200">
            Ir al catálogo
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowPreviousModal(true)}
          disabled={!cutoffStatus.isOpen}
          className="text-left bg-gray-800 border border-gray-700 hover:border-emerald-600 rounded-xl p-6 transition group disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-gray-700"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-300 flex items-center justify-center mb-5">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-100 mb-2">Iniciar un pedido basado en cotización anterior</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Selecciona una cotización previa, revisa sus productos y carga esos ítems al carrito para ajustarlos rápidamente.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 group-hover:text-emerald-200">
            Elegir cotización
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>

      {!cutoffStatus.isOpen && (
        <div className="bg-amber-950 border border-amber-800 rounded-xl px-5 py-4">
          <p className="text-sm text-amber-300">{cutoffStatus.message}</p>
        </div>
      )}

      {showPreviousModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-100">Elegir cotización anterior</h3>
                <p className="text-xs text-gray-500 mt-0.5">Puedes previsualizarla antes de cargarla al carrito.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowPreviousModal(false); setPreviewOrder(null); }}
                className="p-1.5 text-gray-500 hover:text-gray-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] min-h-[420px]">
              <div className="border-b lg:border-b-0 lg:border-r border-gray-700 overflow-y-auto max-h-[70vh]">
                {previousOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Package className="w-12 h-12 text-gray-700 mb-3" />
                    <p className="text-sm text-gray-500">Aún no tienes cotizaciones previas.</p>
                    <button
                      type="button"
                      onClick={startFromScratch}
                      disabled={!cutoffStatus.isOpen}
                      className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                    >
                      Crear una desde cero
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {previousOrders.map(order => (
                      <div key={order.id} className="p-4 hover:bg-gray-700/40 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-mono font-semibold text-blue-300">{order.code || order.id}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CO') : '—'} · {order.items?.length ?? 0} ítem(s)
                            </p>
                            <p className="text-sm font-semibold text-gray-200 mt-2">{formatCOP(order.total)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewOrder(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver
                            </button>
                            <button
                              type="button"
                              onClick={() => usePreviousOrder(order)}
                              disabled={!cutoffStatus.isOpen}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950 border border-emerald-800 rounded-lg hover:bg-emerald-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Usar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 overflow-y-auto max-h-[70vh]">
                {!previewOrder ? (
                  <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center border border-dashed border-gray-700 rounded-xl">
                    <Eye className="w-10 h-10 text-gray-700 mb-3" />
                    <p className="text-sm text-gray-500">Selecciona "Ver" para previsualizar una cotización.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Previsualización</p>
                        <h4 className="text-xl font-bold text-gray-100 font-mono">{previewOrder.code || previewOrder.id}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {previewOrder.createdAt ? new Date(previewOrder.createdAt).toLocaleDateString('es-CO') : '—'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => usePreviousOrder(previewOrder)}
                        disabled={!cutoffStatus.isOpen}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Cargar al carrito
                      </button>
                    </div>

                    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left text-xs text-gray-500 uppercase px-4 py-3">Producto</th>
                            <th className="text-center text-xs text-gray-500 uppercase px-4 py-3">Cant.</th>
                            <th className="text-right text-xs text-gray-500 uppercase px-4 py-3">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {(previewOrder.items || []).map((item, index) => (
                            <tr key={`${item.productId}-${index}`}>
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-100">{item.productName}</p>
                                <p className="text-xs text-gray-500">{formatCOP(item.unitPrice)} / {item.unit}</p>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-300">{item.quantity}</td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-200">
                                {formatCOP(item.unitPrice * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-700">
                            <td colSpan={2} className="px-4 py-3 text-right text-sm font-bold text-gray-300">Total</td>
                            <td className="px-4 py-3 text-right text-base font-bold text-blue-300">{formatCOP(previewOrder.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
