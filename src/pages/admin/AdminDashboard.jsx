import { useState } from 'react';
import {
  Package, Users, Link2, ClipboardList, CheckCircle,
  Box, CalendarDays, X, TrendingUp, ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCOP } from '../../data/mockData';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/* ── Custom Recharts tooltip ───────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-elevated px-3.5 py-2.5 text-xs">
      <p className="text-zinc-500 font-medium mb-1">{label}</p>
      <p className="text-base font-bold text-brand-400 tabular-nums">{formatCOP(payload[0].value)}</p>
    </div>
  );
}

/* ── KPI Card ──────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, accent = 'indigo', trend }) {
  const colors = {
    indigo:  { ring: 'bg-brand-900/60 text-brand-400',  dot: 'bg-brand-600' },
    emerald: { ring: 'bg-emerald-900/40 text-emerald-400', dot: 'bg-emerald-600' },
    amber:   { ring: 'bg-amber-900/40 text-amber-400',  dot: 'bg-amber-600' },
    purple:  { ring: 'bg-purple-900/40 text-purple-400', dot: 'bg-purple-600' },
  };
  const c = colors[accent] || colors.indigo;
  return (
    <div className="card p-4 flex items-start gap-3 hover:border-zinc-700 transition-all duration-200 group cursor-default">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.ring}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider leading-none mb-2">{label}</p>
        <p className="text-2xl font-bold text-zinc-50 tabular-nums leading-none">{value}</p>
        {trend && (
          <p className="text-[10px] text-zinc-600 mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Highlight Card ─────────────────────────────── */
function HighlightCard({ label, value, sub, icon: Icon, colorClass }) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-5 border ${colorClass} flex items-center gap-4`}>
      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
        <p className="text-3xl font-bold tabular-nums leading-none">{value}</p>
        {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
      </div>
      <ArrowUpRight className="absolute top-3 right-3 w-4 h-4 opacity-20" />
    </div>
  );
}

/* ── Skeleton row ───────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[80, 140, 100, 80, 90, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-3 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

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

  const filtered  = orders.filter(o => inRange(o.createdAt));
  const clients   = users.filter(u => u.role === 'client');
  const siigoLinked = filtered.filter(o => o.siigoUrl);
  const siigoLinkedPct = filtered.length > 0 ? Math.round((siigoLinked.length / filtered.length) * 100) : 0;
  const quotedUnits = filtered.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  const recentOrders = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const productQtyMap = {};
  filtered.forEach(o => o.items.forEach(item => {
    if (!productQtyMap[item.productId])
      productQtyMap[item.productId] = { name: item.productName, qty: 0 };
    productQtyMap[item.productId].qty += item.quantity;
  }));
  const topProducts = Object.values(productQtyMap).sort((a, b) => b.qty - a.qty).slice(0, 10);
  const maxQty = topProducts[0]?.qty || 1;

  const monthlyMap = {};
  MONTHS.forEach((_, i) => { monthlyMap[i] = 0; });
  filtered.forEach(o => {
    const m = new Date(o.createdAt).getMonth();
    if (!isNaN(m)) monthlyMap[m] = (monthlyMap[m] || 0) + o.total;
  });
  const chartData = MONTHS.map((name, i) => ({ name, total: monthlyMap[i] }));

  function getRequesterName(order) {
    return order.requestedByName || users.find(u => u.id === (order.requestedById || order.clientId))?.name || 'Desconocido';
  }

  const STATUS_COLORS = {
    sent:     'bg-brand-900/50 text-brand-300 border-brand-800/40',
    approved: 'bg-emerald-900/50 text-emerald-300 border-emerald-800/40',
    rejected: 'bg-red-900/50 text-red-300 border-red-800/40',
    synced:   'bg-purple-900/50 text-purple-300 border-purple-800/40',
    draft:    'bg-zinc-800 text-zinc-400 border-zinc-700/40',
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ───────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50 tracking-tight">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Resumen general del sistema comercial</p>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 shadow-card">
            <CalendarDays className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
            <span className="text-xs text-zinc-600 hidden sm:inline">Desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none w-28 cursor-pointer"
            />
            <span className="text-zinc-700">—</span>
            <span className="text-xs text-zinc-600 hidden sm:inline">Hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none w-28 cursor-pointer"
            />
          </div>
          {isFiltered && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="btn-ghost text-xs text-zinc-500 border border-zinc-800 px-3 py-2 rounded-xl"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {isFiltered && (
        <div className="flex items-center gap-2 text-xs text-brand-300 bg-brand-950/40 border border-brand-900/50 rounded-lg px-3.5 py-2 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
          Mostrando {filtered.length} cotización{filtered.length !== 1 ? 'es' : ''} en el rango seleccionado
        </div>
      )}

      {/* ── Highlight cards ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HighlightCard
          label="Cotizaciones en SIIGO"
          value={siigoLinked.length}
          sub={`${siigoLinkedPct}% del total cotizado`}
          icon={CheckCircle}
          colorClass="bg-emerald-950/60 border-emerald-800/40 text-emerald-100"
        />
        <HighlightCard
          label="Unidades cotizadas"
          value={quotedUnits.toLocaleString()}
          sub="unidades en periodo seleccionado"
          icon={Box}
          colorClass="bg-brand-950/60 border-brand-800/40 text-brand-100"
        />
      </div>

      {/* ── KPI cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Total Productos"    value={products.length}  icon={Package}       accent="indigo" />
        <KpiCard label="Total Clientes"     value={clients.length}   icon={Users}         accent="emerald" />
        <KpiCard label="Sin link SIIGO"     value={filtered.length - siigoLinked.length} icon={Link2} accent="amber" />
        <KpiCard label="Total Cotizaciones" value={filtered.length}  icon={ClipboardList} accent="purple" />
      </div>

      {/* ── Top products + recent orders ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Top 10 */}
        <div className="card lg:col-span-2">
          <div className="px-5 py-4 border-b border-zinc-800/60">
            <p className="text-sm font-semibold text-zinc-100">Top 10 Productos</p>
            <p className="text-xs text-zinc-600 mt-0.5">Por unidades en el periodo</p>
          </div>
          <div className="p-4 space-y-2.5">
            {topProducts.length === 0 ? (
              <div className="py-10 text-center">
                <Package className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Sin datos en el periodo</p>
              </div>
            ) : topProducts.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-zinc-700 w-4 text-right flex-shrink-0 tabular-nums">{idx + 1}</span>
                    <span className="text-xs text-zinc-300 truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-brand-400 ml-2 flex-shrink-0 tabular-nums">{item.qty}</span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden ml-6">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-500"
                    style={{ width: `${(item.qty / maxQty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="card lg:col-span-3 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/60">
            <p className="text-sm font-semibold text-zinc-100">Cotizaciones Recientes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="table-head-cell">ID</th>
                  <th className="table-head-cell">Solicitante</th>
                  <th className="table-head-cell hidden sm:table-cell">Fecha</th>
                  <th className="table-head-cell">Total</th>
                  <th className="table-head-cell">SIIGO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {recentOrders.length === 0
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  : recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors duration-150">
                      <td className="table-cell">
                        <span className="text-brand-400 font-mono text-xs">{order.id?.slice(0, 8)}…</span>
                      </td>
                      <td className="table-cell text-zinc-200">{getRequesterName(order)}</td>
                      <td className="table-cell text-zinc-500 hidden sm:table-cell text-xs">{order.createdAt}</td>
                      <td className="table-cell font-semibold text-zinc-100 tabular-nums text-xs">{formatCOP(order.total)}</td>
                      <td className="table-cell">
                        <span className={`badge border ${order.siigoUrl ? STATUS_COLORS.synced : 'bg-zinc-800/50 text-zinc-600 border-zinc-700/40'}`}>
                          {order.siigoUrl ? 'Vinculado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && !isFiltered && (
              <div className="py-10 text-center">
                <ClipboardList className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-zinc-600">No hay cotizaciones aún</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chart ──────────────────────────────────── */}
      <div className="card p-5">
        <div className="mb-5">
          <p className="text-sm font-semibold text-zinc-100">Histórico de Consumos</p>
          <p className="text-xs text-zinc-600 mt-0.5">
            Monto total de cotizaciones por mes{isFiltered ? ' · filtrado por periodo' : ''}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#52525b', fontFamily: 'Inter' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tickFormatter={v => v === 0 ? '0' : `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10, fill: '#52525b', fontFamily: 'Inter' }}
              axisLine={false} tickLine={false} width={44}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
            <Area
              type="monotone" dataKey="total"
              stroke="#6366f1" strokeWidth={2}
              fill="url(#chartGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
