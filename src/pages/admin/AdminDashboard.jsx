import { useState } from 'react';
import { Package, Users, ShoppingCart, ClipboardList, CheckCircle, Box, CalendarDays, X } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { STATUS_STYLES, formatCOP } from '../../data/mockData';

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

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-100">{value}</p>
      </div>
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
        <p className={`text-3xl font-bold ${text}`}>{value}</p>
        {sub && <p className={`text-sm font-semibold ${text} opacity-70 mt-0.5`}>{sub}</p>}
      </div>
    </div>
  );
}

const inputCls = 'border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100';

export default function AdminDashboard() {
  const { products, orders } = useApp();
  const { users } = useAuth();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const isFiltered = dateFrom || dateTo;

  function inRange(dateStr) {
    const d = new Date(dateStr);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo   && d > new Date(dateTo))   return false;
    return true;
  }

  const filtered = orders.filter(o => inRange(o.createdAt));

  const clients       = users.filter(u => u.role === 'client');
  const pendingOrders = filtered.filter(o => o.status === 'Pendiente').length;
  const deliveredOrders = filtered.filter(o => o.status === 'Entregado');
  const deliveredPct  = filtered.length > 0
    ? Math.round((deliveredOrders.length / filtered.length) * 100)
    : 0;
  const deliveredUnits = deliveredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0
  );

  const recentOrders = [...filtered]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const productQtyMap = {};
  filtered.forEach(o => o.items.forEach(item => {
    if (!productQtyMap[item.productId]) {
      productQtyMap[item.productId] = { productId: item.productId, name: item.productName, qty: 0 };
    }
    productQtyMap[item.productId].qty += item.quantity;
  }));
  const topProducts = Object.values(productQtyMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const monthlyMap = {};
  MONTHS.forEach((_, i) => { monthlyMap[i] = 0; });
  filtered.forEach(o => {
    const month = new Date(o.createdAt).getMonth();
    if (!isNaN(month)) monthlyMap[month] = (monthlyMap[month] || 0) + o.total;
  });
  const chartData = MONTHS.map((name, i) => ({ name, total: monthlyMap[i] }));

  function getClientName(clientId) {
    return users.find(u => u.id === clientId)?.name || 'Desconocido';
  }

  function getRequesterName(order) {
    return order.requestedByName || getClientName(order.requestedById || order.clientId);
  }

  return (
    <div className="space-y-6">

      {/* Header + date filter */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">Resumen general del sistema</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-400">Desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className={inputCls}
            />
            <span className="text-xs font-medium text-gray-400">Hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className={inputCls}
            />
          </div>
          {isFiltered && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-950 border border-gray-700 rounded-xl transition"
            >
              <X className="w-4 h-4" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {isFiltered && (
        <div className="text-xs text-blue-300 bg-blue-950 border border-blue-800 rounded-lg px-4 py-2 font-medium">
          Mostrando {filtered.length} cotización(s) en el rango seleccionado
        </div>
      )}

      {/* Highlight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HighlightCard
          label="Cotizaciones entregadas"
          value={deliveredOrders.length}
          sub={`${deliveredPct}% del total de cotizaciones`}
          icon={CheckCircle}
          bg="bg-green-600"
          text="text-white"
        />
        <HighlightCard
          label="Productos entregados"
          value={deliveredUnits}
          sub="unidades en cotizaciones entregadas"
          icon={Box}
          bg="bg-sky-600"
          text="text-white"
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Productos"    value={products.length}  icon={Package}       color="bg-blue-600"    />
        <StatCard label="Total Clientes"     value={clients.length}   icon={Users}         color="bg-emerald-600" />
        <StatCard label="Cotizaciones Pendientes" value={pendingOrders}    icon={ShoppingCart}  color="bg-yellow-600"  />
        <StatCard label="Total Cotizaciones"      value={filtered.length}  icon={ClipboardList} color="bg-purple-600"  />
      </div>

      {/* Top products + Recent orders */}
      <div className="flex gap-4 items-start">

        {/* Top 10 — 40% */}
        <div className="w-2/5 bg-gray-800 rounded-xl shadow-sm border border-gray-700 flex-shrink-0">
          <div className="px-5 py-4 border-b border-gray-700">
            <h3 className="text-base font-semibold text-gray-100">Top 10 Productos</h3>
            <p className="text-xs text-gray-500 mt-0.5">Por unidades consumidas en el periodo</p>
          </div>
          <div className="p-4 space-y-2">
            {topProducts.map((item, idx) => {
              return (
                <div key={item.productId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-gray-500 w-5 flex-shrink-0">{idx + 1}</span>
                      <span className="text-xs font-medium text-gray-300 truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-blue-400 ml-2 flex-shrink-0">{item.qty}</span>
                  </div>
                </div>
              );
            })}
            {topProducts.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">Sin datos en el periodo seleccionado</p>
            )}
          </div>
        </div>

        {/* Cotizaciones recientes — 60% */}
        <div className="flex-1 bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-base font-semibold text-gray-100">Cotizaciones Recientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Cotización</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Solicitante</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Sucursal</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Fecha</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      No hay cotizaciones en el periodo seleccionado
                    </td>
                  </tr>
                ) : recentOrders.map(order => {
                  const style = STATUS_STYLES[order.status] || {};
                  return (
                    <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-blue-400">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{getRequesterName(order)}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{order.sucursalName || 'Sin sucursal'}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{order.createdAt}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-200">{formatCOP(order.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Histórico de consumos */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-100">Histórico de Consumos</h3>
          <p className="text-xs text-gray-500 mt-0.5">Monto total de cotizaciones por mes{isFiltered ? ' · filtrado por periodo' : ''}</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280', fontFamily: 'Montserrat' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => v === 0 ? '0' : `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6b7280', fontFamily: 'Montserrat' }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorTotal)"
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#1d4ed8', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
