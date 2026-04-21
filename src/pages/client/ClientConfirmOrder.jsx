import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Minus, Plus, CheckCircle, ArrowLeft, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCOP } from '../../data/mockData';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getClientRoute, getRouteCutoffStatus } from '../../utils/routeCutoff';

export default function ClientConfirmOrder() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cart, cartTotal, updateCartItem, removeFromCart, submitOrder, companies, routes } = useApp();
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [cartItemToDelete, setCartItemToDelete] = useState(null);
  const { route } = getClientRoute(currentUser, companies, routes);
  const cutoffStatus = getRouteCutoffStatus(route);

  function handleSubmit() {
    if (!cutoffStatus.isOpen) return;
    const orderId = submitOrder(currentUser, null, notes);
    setSubmitted(orderId);
  }

  if (cart.length === 0 && !submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShoppingCart className="w-14 h-14 text-gray-700 mb-4" />
        <h2 className="text-xl font-bold text-gray-200 mb-2">Tu cotización está vacía</h2>
        <p className="text-gray-400 text-sm mb-6">Agrega productos desde el catálogo antes de confirmar.</p>
        <button
          onClick={() => navigate('/cliente/catalogo', { state: { showCatalogIntro: true } })}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Ir al catálogo
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-green-950 rounded-full flex items-center justify-center mb-5">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">¡Cotización enviada!</h2>
        <p className="text-gray-400 text-sm mb-1">Tu cotización fue registrada exitosamente.</p>
        <p className="text-gray-500 text-sm mb-3">Un asesor atenderá tu cotización lo antes posible.</p>
        <p className="font-mono text-blue-400 font-bold text-xl mb-8">{submitted}</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/cliente/cotizaciones')}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
          >
            <FileText className="w-4 h-4" />
            Ver mis cotizaciones
          </button>
          <button
            onClick={() => navigate('/cliente/catalogo')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <ShoppingCart className="w-4 h-4" />
            Seguir comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/cliente/catalogo')}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Confirmar Cotización</h2>
          <p className="text-sm text-gray-400 mt-0.5">Revisa tu cotización antes de enviarla</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-gray-100">Productos de la cotización</h3>
        </div>
        <div className="divide-y divide-gray-700">
          {cart.map(item => (
            <div key={item.productId} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-100 truncate">{item.productName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatCOP(item.unitPrice)} por {item.unit}</p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center border border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-700 transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-10 text-center text-sm font-medium text-gray-100 border-x border-gray-600 py-1">{item.quantity}</span>
                <button
                  onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-700 transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <p className="text-sm font-bold text-blue-400 w-24 text-right">
                {formatCOP(item.unitPrice * item.quantity)}
              </p>

              <button
                onClick={() => setCartItemToDelete(item)}
                className="p-1.5 text-gray-600 hover:text-red-400 transition flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="px-5 py-4 bg-gray-900 border-t border-gray-700 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Total de la cotización</span>
          <span className="text-2xl font-bold text-gray-100">{formatCOP(cartTotal)}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-5">
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Notas o instrucciones especiales
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Ej: entregar en horario de mañana, facturar a nombre de..."
          className="w-full border border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-700 text-gray-100 placeholder-gray-500"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!cutoffStatus.isOpen}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-bold transition shadow-sm disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
      >
        {cutoffStatus.isOpen ? 'Enviar mi cotización' : 'Recepción cerrada para esta ruta'}
      </button>

      {cartItemToDelete && (
        <ConfirmDialog
          title="Eliminar producto"
          message={`Confirma que deseas quitar "${cartItemToDelete.productName}" de la cotización.`}
          onCancel={() => setCartItemToDelete(null)}
          onConfirm={() => {
            removeFromCart(cartItemToDelete.productId);
            setCartItemToDelete(null);
          }}
        />
      )}
    </div>
  );
}
