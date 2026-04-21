import logo from '../../logo-daval.jpeg';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, X, Minus, Plus, Trash2, Search, ClipboardCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatCOP } from '../../data/mockData';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function ClientLayout() {
  const { currentUser, logout, users } = useAuth();
  const { cart, cartTotal, cartCount, updateCartItem, removeFromCart, orders } = useApp();

  const isSupervisor = currentUser?.clientRole === 'supervisor';
  const companyClientIds = isSupervisor
    ? users.filter(u => u.role === 'client' && u.companyId === currentUser.companyId).map(u => u.id)
    : [];
  const pendingApprovalCount = isSupervisor
    ? orders.filter(o => o.status === 'Pendiente por aprobar' && companyClientIds.includes(o.clientId)).length
    : 0;
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cartItemToDelete, setCartItemToDelete] = useState(null);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleConfirm() {
    setCartOpen(false);
    navigate('/cliente/confirmar-cotizacion');
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 text-gray-100 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <div className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1">
              <img
                src={logo}
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-9 pr-4 py-2 bg-gray-700 text-gray-100 placeholder-gray-500 rounded-lg text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="flex gap-1">
            <NavLink
              to="/cliente"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`
              }
            >
              Catálogo
            </NavLink>
            <NavLink
              to="/cliente/cotizaciones"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`
              }
            >
              Mis Cotizaciones
            </NavLink>
            {isSupervisor && (
              <>
                <NavLink
                  to="/cliente/aprobar-cotizaciones"
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${isActive ? 'bg-yellow-500 text-gray-900' : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'}`
                  }
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Aprobar Cotizaciones
                  {pendingApprovalCount > 0 && (
                    <span className="ml-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {pendingApprovalCount}
                    </span>
                  )}
                </NavLink>
                <NavLink
                  to="/cliente/administrar"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`
                  }
                >
                  <Users className="w-4 h-4" />
                  Administrar
                </NavLink>
              </>
            )}
          </nav>

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* User */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold hidden sm:flex">
              {currentUser?.initials}
            </div>
            <span className="text-sm text-gray-400 hidden md:block">{currentUser?.name}</span>
            <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-white transition" title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet context={{ search }} />
      </main>

      {/* Cart Slide-Over */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black bg-opacity-60" onClick={() => setCartOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-gray-800 border-l border-gray-700 z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold text-gray-100">Carrito de Compras</h2>
                {cartCount > 0 && (
                  <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full font-medium">{cartCount} items</span>
                )}
              </div>
              <button onClick={() => setCartOpen(false)} className="p-1 text-gray-500 hover:text-gray-300 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <>
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <ShoppingCart className="w-12 h-12 text-gray-700 mb-3" />
                    <p className="text-gray-500 text-sm">Tu carrito está vacío</p>
                    <p className="text-gray-600 text-xs mt-1">Agrega productos desde el catálogo</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.productId} className="flex items-start gap-3 p-3 bg-gray-700 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-100 truncate">{item.productName}</p>
                          <p className="text-xs text-gray-400">{formatCOP(item.unitPrice)} / {item.unit}</p>
                          <p className="text-sm font-semibold text-blue-400 mt-1">
                            {formatCOP(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => setCartItemToDelete(item)}
                            className="p-1 text-gray-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center border border-gray-600 rounded text-gray-300 hover:bg-gray-600 transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-gray-100">{item.quantity}</span>
                            <button
                              onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center border border-gray-600 rounded text-gray-300 hover:bg-gray-600 transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-gray-700 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Total estimado</p>
                    <p className="text-xl font-bold text-gray-100">{formatCOP(cartTotal)}</p>
                  </div>
                  <button
                    onClick={handleConfirm}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Revisar y confirmar cotización
                  </button>
                </div>
              )}
            </>
          </div>
        </>
      )}

      {cartItemToDelete && (
        <ConfirmDialog
          title="Eliminar producto"
          message={`Confirma que deseas quitar "${cartItemToDelete.productName}" del carrito.`}
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
