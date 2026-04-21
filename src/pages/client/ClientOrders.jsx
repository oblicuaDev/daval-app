import { useNavigate } from 'react-router-dom';
import { Package, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCOP } from '../../data/mockData';

export default function ClientOrders() {
  const { orders }      = useApp();
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  const myOrders = [...orders]
    .filter(o => o.clientId === currentUser?.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function getSucursalName(order) {
    return order.sucursalName || 'Sin sucursal';
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Mis Cotizaciones</h2>
        <p className="text-sm text-gray-400 mt-1">{myOrders.length} cotizaciones en total</p>
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
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Siigo</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {myOrders.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/cliente/cotizaciones/${order.id}`)}
                  >
                    <td className="px-5 py-4 text-sm font-mono font-medium text-blue-400">{order.id}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">{getSucursalName(order)}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">{order.createdAt}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">{order.items.length} ítem(s)</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-200">{formatCOP(order.total)}</td>
                    <td className="px-5 py-4">
                      {order.siigoUrl ? (
                        <a
                          href={order.siigoUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-200 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">Sin link</span>
                      )}
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
              {myOrders.length === 0 && (
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
