import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Truck, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { STATUS_STYLES, ORDER_STATUSES, formatCOP } from '../../data/mockData';

export default function AdvisorOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrder } = useApp();
  const { users } = useAuth();

  const order = orders.find(o => o.id === orderId);

  const [status, setStatus] = useState(order?.status || '');
  const [carrier, setCarrier] = useState(order?.carrier || '');
  const [notes, setNotes] = useState(order?.notes || '');
  const [saved, setSaved] = useState(false);

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Pedido no encontrado</p>
        <button onClick={() => navigate('/asesor')} className="mt-4 text-blue-700 hover:text-blue-800 text-sm font-medium">
          Volver a la lista
        </button>
      </div>
    );
  }

  const client = users.find(u => u.id === order.clientId);
  const style = STATUS_STYLES[status] || {};

  function handleSave() {
    const updates = { status, notes };
    if (status === 'En Ruta') updates.carrier = carrier;
    updateOrder(orderId, updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate('/asesor')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a pedidos
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-gray-900 font-mono">{order.id}</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${style.bg} ${style.text} ${style.border}`}>
                {order.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Cliente: <span className="font-medium text-gray-700">{client?.name || '—'}</span>
            </p>
            <p className="text-gray-500 text-sm">
              Fecha: <span className="font-medium text-gray-700">{order.createdAt}</span>
              {order.updatedAt !== order.createdAt && (
                <span> · Actualizado: <span className="font-medium text-gray-700">{order.updatedAt}</span></span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total del pedido</p>
            <p className="text-3xl font-bold text-blue-700">{formatCOP(order.total)}</p>
          </div>
        </div>
      </div>

      {/* Status Update */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" />
          Actualizar Estado
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado del pedido</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ORDER_STATUSES.map(s => {
                const st = STATUS_STYLES[s] || {};
                const isSelected = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-medium border-2 transition text-left ${
                      isSelected
                        ? `${st.bg} ${st.text} ${st.border} border-2`
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {status === 'En Ruta' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transportador *</label>
              <input
                type="text"
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                placeholder="Ej: TCC, Envia, Servientrega..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {order.carrier && status !== 'En Ruta' && (
            <p className="text-sm text-gray-500">
              Transportador anterior: <span className="font-medium text-gray-700">{order.carrier}</span>
            </p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Productos del Pedido</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Producto</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Unidad</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Cantidad</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Precio Unit.</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{item.productName}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{item.unit}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{item.quantity}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{formatCOP(item.unitPrice)}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-800">{formatCOP(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={4} className="px-5 py-3 text-sm font-bold text-gray-700 text-right">Total</td>
                <td className="px-5 py-3 text-base font-bold text-blue-700">{formatCOP(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Notas del Pedido
        </h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Agrega notas o instrucciones especiales..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition shadow-sm"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            Cambios guardados
          </div>
        )}
      </div>
    </div>
  );
}
