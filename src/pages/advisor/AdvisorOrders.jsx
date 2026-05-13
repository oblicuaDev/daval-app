import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ClipboardList, Link2, Box, CalendarDays, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdvisorStats } from '../../hooks/useStats.js';
import { useQuotations } from '../../hooks/useQuotations.js';
import { formatCOP } from '../../utils/format.js';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
      <p className="text-base font-bold text-blue-400">{formatCOP(payload[0].value)}</p>
    </div>
  );
}

function HighlightCard({ label, value, sub, icon: Icon, bg, text }) {
  return (
    <div className={`${bg} rounded-xl p-6 flex items-center gap-4 shadow-sm`}>
      <div className="w-12 h-12 bg-white bg-opacity-25 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className={`w-6 h-6 ${text}`} />
      </div>
      <div>
        <p className={`text-sm font-medium ${text} opacity-80`}>{label}</p>
        <p className={`text-3xl font-bold ${text}`}>{value ?? '—'}</p>
        {sub && <p className={`text-sm font-semibold ${text} opacity-70 mt-0.5`}>{sub}</p>}
      </div>
    </div>
  );
}

export default function AdvisorOrders() {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const isFiltered = dateFrom || dateTo;

  const { data: orders = [], isLoading } = useQuotations();
  const { data: stats } = useAdvisorStats();

  const topProducts    = stats?.topProducts ?? [];
  const monthlyRevenue = stats?.monthlyRevenue ?? [];
  const ordersCount    = stats?.ordersCount ?? orders.length;

  const filtered = orders.filter(o => {
    if (!isFiltered) return true;
    const d = new Date(o.createdAt);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo   && d > new Date(dateTo))   return false;
    return true;
  });

  const siigoLinked = filtered.filter(o => o.siigoUrl);
  const siigoLinkedPct = filtered.length > 0 ? Math.round((siigoLinked.length / filtered.length) * 100) : 0;

  const chartData = MONTHS.map((name, i) => {
    const monthStr = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`;
    const found = monthlyRevenue.find(m => m.month === monthStr);
    return { name, total: found ? Number(found.total) : 0 };
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Cotizaciones Asignadas</h2>
          <p className="text-sm text-gray-400 mt-1">{ordersCount} cotizaciones en total</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Desde</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-700 text-gray-100 focus:outline-none" />
            <span className="text-xs text-gray-400">Hasta</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-700 text-gray-100 focus:outline-none" />
          </div>
          {isFiltered && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-red-300 border border-gray-700 rounded-xl transition">
              <X className="w-4 h-4" /> Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HighlightCard label="Cotizaciones en Siigo" value={siigoLinked.length}
          sub={`${siigoLinkedPct}% del total`} icon={Link2} bg="bg-green-500" text="text-white" />
        <HighlightCard label="Total cotizaciones" value={filtered.length}
          sub="en el periodo seleccionado" icon={Box} bg="bg-sky-400" text="text-white" />
      </div>

      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                {['# Cotización','Cliente','Empresa','Sucursal','Fecha','Total','Estado','Acciones'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} className="px-5 py-4"><div className="skeleton h-3 rounded w-20" /></td>
                ))}</tr>
              )) : filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-5 py-4 text-sm font-mono font-medium text-blue-400">{order.code ?? order.id?.slice(0,8)}</td>
                  <td className="px-5 py-4 text-sm text-gray-300">{order.clientName ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{order.companyName ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{order.branchName ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-100">{formatCOP(order.total)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium ${order.siigoUrl ? 'text-blue-300' : 'text-gray-500'}`}>
                      {order.siigoUrl ? 'Con link' : 'Sin link'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => navigate(`/asesor/cotizacion/${order.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-blue-300 bg-blue-950 hover:bg-blue-900 rounded-lg text-xs font-medium transition">
                      <Eye className="w-3.5 h-3.5" /> Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No hay cotizaciones asignadas</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        <div className="w-2/5 bg-gray-800 rounded-xl shadow-sm border border-gray-700 flex-shrink-0">
          <div className="px-5 py-4 border-b border-gray-700">
            <h3 className="text-base font-semibold text-gray-200">Top 10 Productos</h3>
            <p className="text-xs text-gray-400 mt-0.5">Por ingresos en el periodo</p>
          </div>
          <div className="p-4 space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
            ) : topProducts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">{idx + 1}</span>
                  <span className="text-xs font-medium text-gray-300 truncate">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-blue-400 ml-2">{item.qty}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-200">Histórico de Consumos</h3>
            <p className="text-xs text-gray-400 mt-0.5">Monto total por mes · últimos 12 meses</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAdvisor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => v === 0 ? '0' : `$${(v/1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#colorAdvisor)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#1d4ed8', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
