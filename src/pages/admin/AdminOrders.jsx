import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { STATUS_STYLES, ORDER_STATUSES, formatCOP } from '../../data/mockData';

const CARRIERS = ['TCC', 'Envia', 'Servientrega', 'Coordinadora', 'Interrapidísimo'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { orders, updateOrder } = useApp();
  const { users } = useAuth();
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editCarrier, setEditCarrier] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const advisors = users.filter(u => u.role === 'advisor');

  function getName(id) {
    return users.find(u => u.id === id)?.name || '—';
  }

  const filtered = orders
    .filter(o => filterStatus ? o.status === filterStatus : true)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function openOrder(order) {
    setSelected(order);
    setEditStatus(order.status);
    setEditCarrier(order.carrier || '');
    setEditNotes(order.notes || '');
  }

  function handleSave() {
    updateOrder(selected.id, {
      status: editStatus,
      carrier: editStatus === 'En Ruta' ? editCarrier : selected.carrier,
      notes: editNotes,
    });
    setSelected(null);
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trabajar Pedidos</h2>
          <p className="text-sm text-gray-500 mt-1">{orders.length} pedidos en total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none border border-gray-300 rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos los estados</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"># Pedido</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Asesor asignado</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fecha</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Monto</th>
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
                    <td className="px-5 py-4 text-sm text-gray-700">{getName(order.clientId)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {order.advisorId ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {getName(order.advisorId).charAt(0)}
                          </span>
                          {getName(order.advisorId)}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{order.createdAt}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">{formatCOP(order.total)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openOrder(order)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-sm text-gray-400">
                    No hay pedidos con ese estado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      {selected && (
        <Modal title={`Pedido ${selected.id}`} onClose={() => setSelected(null)}>
          <div className="space-y-5">
            {/* Info row */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Cliente</p>
                <p className="font-semibold text-gray-800">{getName(selected.clientId)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Asesor</p>
                <p className="font-semibold text-gray-800">{getName(selected.advisorId)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Fecha</p>
                <p className="font-semibold text-gray-800">{selected.createdAt}</p>
              </div>
            </div>

            {/* Items */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Producto</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Cant.</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Precio unit.</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selected.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-700">{item.productName}</td>
                      <td className="px-4 py-2 text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-2 text-gray-600">{formatCOP(item.unitPrice)}</td>
                      <td className="px-4 py-2 font-semibold text-gray-800">{formatCOP(item.unitPrice * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-100">
                    <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-600 text-right">Total</td>
                    <td className="px-4 py-2 text-base font-bold text-blue-700">{formatCOP(selected.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Change status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Estado del pedido</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className={inputCls}>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {editStatus === 'En Ruta' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Transportador</label>
                  <select value={editCarrier} onChange={e => setEditCarrier(e.target.value)} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Assign advisor */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Asesor asignado</label>
              <select
                value={selected.advisorId || ''}
                onChange={e => updateOrder(selected.id, { advisorId: Number(e.target.value) || null })}
                className={inputCls}
              >
                <option value="">Sin asignar</option>
                {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notas</label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                className={inputCls + ' resize-none'}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setSelected(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition">
                Guardar cambios
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
