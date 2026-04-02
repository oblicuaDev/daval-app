import { useState } from 'react';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { STATUS_STYLES, formatCOP } from '../../data/mockData';

function OrderRow({ order }) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLES[order.status] || {};

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-5 py-4 text-sm font-mono font-medium text-blue-700">{order.id}</td>
        <td className="px-5 py-4 text-sm text-gray-600">{order.createdAt}</td>
        <td className="px-5 py-4 text-sm text-gray-600">{order.items.length} ítem(s)</td>
        <td className="px-5 py-4 text-sm font-semibold text-gray-800">{formatCOP(order.total)}</td>
        <td className="px-5 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
            {order.status}
          </span>
        </td>
        <td className="px-5 py-4">
          <button className="text-gray-400 hover:text-gray-600 transition">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50">
          <td colSpan={6} className="px-5 py-4">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Detalle del Pedido</h4>
              <div className="bg-white rounded-lg overflow-hidden border border-blue-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Producto</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Cantidad</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Precio Unit.</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.productName}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{formatCOP(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-800">{formatCOP(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-100">
                      <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-700 text-right">Total</td>
                      <td className="px-4 py-2 text-sm font-bold text-blue-700">{formatCOP(order.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {order.notes && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-yellow-800"><span className="font-semibold">Notas:</span> {order.notes}</p>
                </div>
              )}
              {order.carrier && (
                <p className="text-xs text-gray-500">Transportador: <span className="font-medium text-gray-700">{order.carrier}</span></p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ClientOrders() {
  const { orders } = useApp();
  const { currentUser } = useAuth();

  const myOrders = [...orders]
    .filter(o => o.clientId === currentUser?.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mis Pedidos</h2>
        <p className="text-sm text-gray-500 mt-1">{myOrders.length} pedidos en total</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"># Pedido</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fecha</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Items</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myOrders.map(order => (
                <OrderRow key={order.id} order={order} />
              ))}
              {myOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No tienes pedidos aún</p>
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
