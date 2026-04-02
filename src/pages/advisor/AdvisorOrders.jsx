import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ClipboardList } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { STATUS_STYLES, formatCOP } from '../../data/mockData';

const FILTER_TABS = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendiente', value: 'Pendiente' },
  { label: 'En proceso', value: 'process' },
  { label: 'Entregado', value: 'Entregado' },
];

const IN_PROCESS_STATUSES = ['Validar disponibilidad', 'Alistamiento', 'En Ruta'];

export default function AdvisorOrders() {
  const { orders } = useApp();
  const { currentUser, users } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const myOrders = orders.filter(o => o.advisorId === currentUser?.id);

  const filtered = myOrders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'process') return IN_PROCESS_STATUSES.includes(order.status);
    return order.status === activeTab;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function getClientName(clientId) {
    return users.find(u => u.id === clientId)?.name || '—';
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pedidos Asignados</h2>
        <p className="text-sm text-gray-500 mt-1">{myOrders.length} pedidos en total</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {FILTER_TABS.map(tab => {
          const count = tab.value === 'all'
            ? myOrders.length
            : tab.value === 'process'
            ? myOrders.filter(o => IN_PROCESS_STATUSES.includes(o.status)).length
            : myOrders.filter(o => o.status === tab.value).length;

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.value
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.value ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"># Pedido</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fecha</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Items</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(order => {
                const style = STATUS_STYLES[order.status] || {};
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono font-medium text-blue-700">{order.id}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{getClientName(order.clientId)}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{order.createdAt}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{order.items.length}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">{formatCOP(order.total)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => navigate(`/asesor/pedido/${order.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-medium transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No hay pedidos en esta categoría</p>
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
