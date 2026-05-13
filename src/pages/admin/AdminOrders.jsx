import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuotations } from '../../hooks/useQuotations.js';
import { formatCOP } from '../../utils/format.js';

const STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviada', approved: 'Aprobada',
  rejected: 'Rechazada', synced: 'Sincronizada', sent_to_siigo: 'En SIIGO', pending: 'Pendiente',
};

export default function AdminOrders() {
  const { data: orders = [], isLoading } = useQuotations();
  const navigate = useNavigate();

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
                {['# Cotización','Cliente','Empresa','Sucursal','Fecha','Monto','Estado','Siigo','Acciones'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-5 py-4"><div className="skeleton h-3 rounded w-20" /></td>
                  ))}
                </tr>
              )) : orders.map(order => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/admin/cotizaciones/${order.id}`)}
                  className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono font-medium text-blue-400">{order.code ?? order.id?.slice(0,8)}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-300">{order.clientName ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{order.companyName ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{order.branchName ?? 'Sin sucursal'}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-200">{formatCOP(order.total)}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {order.siigoUrl ? (
                      <a href={order.siigoUrl} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-200">
                        <ExternalLink className="w-3.5 h-3.5" /> Ver en Siigo
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">Sin link</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/admin/cotizaciones/${order.id}`); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-950 hover:bg-blue-900 rounded-lg transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Gestionar
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && orders.length === 0 && (
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
