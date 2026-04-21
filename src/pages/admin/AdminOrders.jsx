import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { STATUS_STYLES, ORDER_STATUSES, formatCOP } from '../../data/mockData';

export default function AdminOrders() {
  const { orders } = useApp();
  const { users }  = useAuth();
  const navigate   = useNavigate();
  const [filterStatus, setFilterStatus] = useState('');

  function getName(id) {
    return users.find(u => u.id === id)?.name || '—';
  }

  function getRequestedBy(order) {
    return order.requestedByName || getName(order.requestedById || order.clientId);
  }

  const allStatuses = ['Pendiente por aprobar', ...ORDER_STATUSES];

  const filtered = orders
    .filter(o => filterStatus ? o.status === filterStatus : true)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Trabajar Cotizaciones</h2>
          <p className="text-sm text-gray-400 mt-1">{orders.length} cotizaciones en total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none border border-gray-600 rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
            >
              <option value="">Todos los estados</option>
              {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
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
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.map(order => {
                const style = STATUS_STYLES[order.status] || {};
                const commentCount = order.comments?.length || 0;
                const attachCount  = order.attachments?.length || 0;
                return (
                  <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => navigate(`/admin/cotizaciones/${order.id}`)}
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
                    No hay cotizaciones con ese estado
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
