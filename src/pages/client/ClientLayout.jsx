import logo from '../../logo-daval.jpeg';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarClock, LogOut, MessageCircle, Minus, Plus, Search,
  ShoppingCart, Trash2, Users, X, AlertTriangle, Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatCOP } from '../../data/mockData';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  formatRouteDateTime, formatTimeRemaining,
  getClientRoute, getRouteCutoffStatus,
} from '../../utils/routeCutoff';

const DAVAL_WHATSAPP_NUMBER = '573112345678';
const DAVAL_WHATSAPP_MESSAGE = 'Hola Distribuciones DAVAL, necesito ayuda con la plataforma de cotizaciones.';
const DAVAL_WHATSAPP_URL = `https://wa.me/${DAVAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(DAVAL_WHATSAPP_MESSAGE)}`;

export default function ClientLayout() {
  const { currentUser, logout } = useAuth();
  const { cart, cartTotal, cartCount, updateCartItem, removeFromCart, companies, routes } = useApp();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cartItemToDelete, setCartItemToDelete] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const { sucursal, route } = getClientRoute(currentUser, companies, routes);
  const cutoffStatus = getRouteCutoffStatus(route, now);
  const routeCountdown = formatTimeRemaining(cutoffStatus.routeDate, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  function handleLogout() { logout(); navigate('/login'); }
  function handleConfirm() { setCartOpen(false); navigate('/cliente/confirmar-cotizacion'); }

  const bannerColor = cutoffStatus.missingRoute
    ? 'bg-amber-950/60 border-amber-800/50 text-amber-200'
    : cutoffStatus.isOpen
    ? 'bg-brand-950/40 border-brand-900/50 text-brand-300'
    : 'bg-red-950/60 border-red-800/50 text-red-200';

  const BannerIcon = cutoffStatus.missingRoute ? AlertTriangle : Clock;

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* Header */}
      <header className="sticky top-0 z-30 h-12 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-3">

          {/* Logo */}
          <NavLink to="/cliente" className="flex items-center gap-2 flex-shrink-0" aria-label="Inicio">
            <div className="w-7 h-7 rounded-md overflow-hidden bg-zinc-800 ring-1 ring-white/10">
              <img src={logo} alt="DAVAL" className="w-full h-full object-contain" />
            </div>
            <span className="hidden sm:inline text-sm font-semibold text-zinc-100">DAVAL</span>
          </NavLink>

          <div className="h-4 w-px bg-zinc-800 flex-shrink-0" />

          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 w-3.5 h-3.5 pointer-events-none" aria-hidden="true" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                aria-label="Buscar productos en el catálogo"
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 text-zinc-200 placeholder-zinc-600 rounded-md text-sm border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/60 transition-all duration-150"
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {[
              { to: '/cliente', label: 'Catálogo', end: true },
              { to: '/cliente/cotizaciones', label: 'Cotizaciones' },
              { to: '/cliente/administrar', label: 'Cuenta', icon: Users },
            ].map(({ to, label, end, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-zinc-50 bg-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`
                }
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            aria-label={`Ver carrito${cartCount > 0 ? `, ${cartCount} productos` : ', vacío'}`}
            aria-expanded={cartOpen}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 transition-all duration-150 flex-shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* User */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-brand-800/40 hidden sm:flex">
              {currentUser?.initials}
            </div>
            <button
              onClick={handleLogout}
              className="btn-ghost p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-950/30"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Route status banner */}
      <div className={`border-b ${bannerColor} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <BannerIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
            <p className="text-xs font-medium">
              {route
                ? `Queda ${routeCountdown} para tu siguiente ruta · ${route.name}`
                : 'Ruta pendiente de asignación'}
            </p>
            {sucursal && (
              <span className="hidden sm:inline text-xs opacity-60">· {sucursal.name}</span>
            )}
          </div>
          {!cutoffStatus.isOpen && cutoffStatus.nextOpenDate && (
            <span className="text-[10px] font-semibold bg-black/30 border border-current/20 rounded-full px-2.5 py-0.5 opacity-90">
              Reabre: {formatRouteDateTime(cutoffStatus.nextOpenDate)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-5 animate-fade-in" tabIndex={-1}>
        <Outlet context={{ search }} />
      </main>

      {/* WhatsApp FAB */}
      <a
        href={DAVAL_WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir WhatsApp de Distribuciones DAVAL"
        className="fixed right-5 bottom-5 z-30 inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-elevated px-4 py-2.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(37,211,102,0.3)] active:translate-y-0"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">¿Necesitas ayuda?</span>
      </a>

      {/* Cart slide-over */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de cotización"
            className="fixed right-0 top-0 h-full w-full sm:w-[360px] bg-zinc-900 border-l border-zinc-800 z-50 shadow-modal flex flex-col animate-slide-in-right"
          >

            {/* Cart header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 text-brand-400" />
                <span className="font-semibold text-sm text-zinc-100">Carrito</span>
                {cartCount > 0 && (
                  <span className="badge bg-brand-900/60 text-brand-300 border border-brand-800/50">
                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="btn-ghost p-1.5 text-zinc-600 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-4">
                    <ShoppingCart className="w-6 h-6 text-zinc-600" />
                  </div>
                  <p className="text-sm font-medium text-zinc-400">Tu carrito está vacío</p>
                  <p className="text-xs text-zinc-600 mt-1">Agrega productos desde el catálogo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div
                      key={item.productId}
                      className="flex items-start gap-3 p-3 bg-zinc-800/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors duration-150"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-100 truncate leading-snug">{item.productName}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{formatCOP(item.unitPrice)} / {item.unit}</p>
                        <p className="text-sm font-bold text-brand-400 mt-1 tabular-nums">
                          {formatCOP(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button
                          onClick={() => setCartItemToDelete(item)}
                          className="p-1 text-zinc-700 hover:text-red-400 transition-colors duration-150"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-zinc-100 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
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

            {/* Cart footer */}
            {cart.length > 0 && (
              <div className="border-t border-zinc-800 p-4 space-y-3 flex-shrink-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-zinc-500 font-medium">Total estimado</span>
                  <span className="text-xl font-bold text-zinc-50 tabular-nums">{formatCOP(cartTotal)}</span>
                </div>
                <button
                  onClick={handleConfirm}
                  className="btn-primary w-full py-3 text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Revisar y confirmar cotización
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {cartItemToDelete && (
        <ConfirmDialog
          title="Eliminar producto"
          message={`¿Quitar "${cartItemToDelete.productName}" del carrito?`}
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
