import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCOP } from '../../data/mockData';

export default function AdminOrders() {
  const { orders } = useApp();
  const { users }  = useAuth();
  const navigate   = useNavigate();

  function getName(id) {
    return users.find(u => u.id === id)?.name || '—';
  }

  function getRequestedBy(order) {
    return order.requestedByName || getName(order.requestedById || order.clientId);
  }

  const filtered = orders
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function openDetail(orderId) {
    navigate(`/admin/cotizaciones/${orderId}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Trabajar Cotizaciones</h2>
          <p className="text-sm text-gray-400 mt-1">{orders.length} cotizaciones en total</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"># Cotización</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Solicitante</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sucursal</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Asesor asignado</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fecha</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Monto</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Siigo</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.map(order => {
                const commentCount = order.comments?.length || 0;
                const attachCount  = order.attachments?.length || 0;
                return (
                  <tr
                    key={order.id}
                    onClick={() => openDetail(order.id)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openDetail(order.id);
                      }
                    }}
                    tabIndex={0}
                    className="hover:bg-gray-700/50 focus:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors cursor-pointer"
                    aria-label={`Ver detalle de la cotización ${order.id}`}
                  >
                    <td className="px-5 py-4">
                      <div className="text-sm font-mono font-medium text-blue-400">{order.id}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {commentCount > 0 && (
                          <span className="text-xs text-gray-500">{commentCount} coment.</span>
                        )}
                        {attachCount > 0 && (
                          <span className="text-xs text-gray-500">{attachCount} adj.</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-300">{getName(order.clientId)}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">{getRequestedBy(order)}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">{order.sucursalName || 'Sin sucursal'}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">
                      {order.advisorId ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-blue-900 text-blue-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {getName(order.advisorId).charAt(0)}
                          </span>
                          {getName(order.advisorId)}
                        </span>
                      ) : (
                        <span className="text-gray-600 italic text-xs">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">{order.createdAt}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-200">{formatCOP(order.total)}</td>
                    <td className="px-5 py-4">
                      {order.siigoUrl ? (
                        <a
                          href={order.siigoUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={event => event.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-200 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver en Siigo
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">Sin link</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={event => {
                          event.stopPropagation();
                          openDetail(order.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-950 hover:bg-blue-900 rounded-lg transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Gestionar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-14 text-center text-sm text-gray-500">
                    No hay cotizaciones registradas
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
