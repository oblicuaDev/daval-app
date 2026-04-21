import { ClipboardCheck, CheckCircle2, XCircle, Package, Calendar, User, FileText, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { STATUS_STYLES, formatCOP } from '../../data/mockData';
import { useState } from 'react';

function ConfirmApproveModal({ order, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 space-y-5">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-yellow-950 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-yellow-400" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-gray-100">¿Estás seguro de aprobar esta cotización?</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Al aprobarla se generará una orden de compra a{' '}
              <span className="font-semibold text-gray-200">Daval</span>.
              Esta acción no se puede deshacer.
            </p>
            {order && (
              <p className="text-xs font-mono text-gray-500 bg-gray-700 rounded-lg px-3 py-1.5 inline-block">
                {order.id} · {formatCOP(order.total)}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Sí, aprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, clientName, requesterName, onApprove, onReject, onClose }) {
  const total = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Detalle de la cotización</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{order.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><User className="w-4 h-4" />Cliente: {clientName}</span>
            <span className="flex items-center gap-1"><User className="w-4 h-4" />Solicitante: {requesterName}</span>
            <span className="flex items-center gap-1"><Package className="w-4 h-4" />Sucursal: {order.sucursalName || 'Sin sucursal'}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{order.createdAt}</span>
          </div>

          <div className="border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-700">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Cant.</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-100">{item.productName}</p>
                      <p className="text-xs text-gray-500">{formatCOP(item.unitPrice)} / {item.unit}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-100">{formatCOP(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-900 border-t border-gray-700">
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-400 text-right">Total</td>
                  <td className="px-4 py-3 text-right text-base font-bold text-gray-100">{formatCOP(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.notes && (
            <div className="bg-yellow-950 border border-yellow-900 rounded-xl p-4">
              <p className="text-xs font-semibold text-yellow-400 uppercase mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Notas
              </p>
              <p className="text-sm text-yellow-200">{order.notes}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { onReject(order.id); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-red-800 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-950 transition"
            >
              <XCircle className="w-4 h-4" />
              Rechazar
            </button>
            <button
              onClick={() => onApprove(order)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientApproveOrders() {
  const { currentUser, users } = useAuth();
  const { orders, updateOrder } = useApp();
  const [selectedOrder, setSelectedOrder]       = useState(null);
  const [confirmOrder, setConfirmOrder]         = useState(null);

  const companyClientIds = users
    .filter(u => u.role === 'client' && u.companyId === currentUser?.companyId)
    .map(u => u.id);

  const pendingOrders = orders.filter(
    o => o.status === 'Pendiente por aprobar' && companyClientIds.includes(o.clientId)
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function getClientName(clientId) {
    return users.find(u => u.id === clientId)?.name || '—';
  }

  function getRequesterName(order) {
    return order.requestedByName || getClientName(order.requestedById || order.clientId);
  }

  function requestApprove(order) {
    setSelectedOrder(null);
    setConfirmOrder(order);
  }

  function confirmApprove() {
    updateOrder(confirmOrder.id, { status: 'Pendiente' });
    setConfirmOrder(null);
  }

  function handleReject(orderId) {
    updateOrder(orderId, { status: 'Rechazado' });
  }

  const statusStyle = STATUS_STYLES['Pendiente por aprobar'];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-950 text-yellow-400 rounded-xl flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Aprobar Cotizaciones</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {pendingOrders.length === 0
              ? 'No hay cotizaciones pendientes de aprobación'
              : `${pendingOrders.length} cotización${pendingOrders.length !== 1 ? 's' : ''} pendiente${pendingOrders.length !== 1 ? 's' : ''} de aprobación`}
          </p>
        </div>
      </div>

      <div className="bg-yellow-950 border border-yellow-900 rounded-xl px-5 py-4 text-sm text-yellow-300">
        Las cotizaciones aprobadas quedan disponibles para que el asesor comercial las gestione. Las rechazadas no pasan a gestión.
      </div>

      {pendingOrders.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col items-center justify-center py-20 text-center">
          <ClipboardCheck className="w-12 h-12 text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">Todo al día</p>
          <p className="text-sm text-gray-500 mt-1">No hay cotizaciones pendientes de aprobación</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingOrders.map(order => {
            const clientName = getClientName(order.clientId);
            const requesterName = getRequesterName(order);
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <div key={order.id} className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-950 text-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-sm font-bold text-gray-100">{order.id}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      Pendiente por aprobar
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="w-3 h-3" />{requesterName}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Package className="w-3 h-3" />{order.sucursalName || 'Sin sucursal'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />{order.createdAt}
                    </span>
                    <span className="text-xs text-gray-600">{itemCount} items</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-base font-bold text-gray-100">{formatCOP(order.total)}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3 py-1.5 border border-gray-600 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-700 transition"
                  >
                    Ver detalle
                  </button>
                  <button
                    onClick={() => handleReject(order.id)}
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-950 rounded-lg transition"
                    title="Rechazar"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => requestApprove(order)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aprobar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          clientName={getClientName(selectedOrder.clientId)}
          requesterName={getRequesterName(selectedOrder)}
          onApprove={requestApprove}
          onReject={handleReject}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {confirmOrder && (
        <ConfirmApproveModal
          order={confirmOrder}
          onConfirm={confirmApprove}
          onCancel={() => setConfirmOrder(null)}
        />
      )}
    </div>
  );
}
