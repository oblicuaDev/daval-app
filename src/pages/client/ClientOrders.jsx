import { useNavigate } from 'react-router-dom';
import { Package, ExternalLink } from 'lucide-react';
import { useQuotations } from '../../hooks/useQuotations.js';
import { formatCOP } from '../../utils/format.js';

export default function ClientOrders() {
  const { data: orders = [], isLoading } = useQuotations();
  const navigate = useNavigate();

  const sorted = [...orders].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Mis Cotizaciones</h2>
        <p className="text-sm text-gray-400 mt-1">{sorted.length} cotizaciones en total</p>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"># Cotización</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sucursal</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fecha</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Items</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-gray-500">Cargando…</td>
                </tr>
              )}
              {sorted.map(order => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/cliente/cotizaciones/${order.id}`)}
                >
                  <td className="px-5 py-4 text-sm font-mono font-medium text-blue-400">{order.code || order.id}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{order.branchName || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">{order.items?.length ?? 0} ítem(s)</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-200">{formatCOP(order.total)}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-blue-950 text-blue-300 px-2 py-1 rounded-full font-medium capitalize">
                      {order.status || 'pendiente'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/cliente/cotizaciones/${order.id}`); }}
                      className="flex items-center gap-1 text-xs text-blue-400 font-medium hover:text-blue-300 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No hay cotizaciones aún</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
