import logo from '../../logo-daval.jpeg';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, Package, FolderOpen, ListOrdered, Users,
  UserCog, LogOut, Menu, X, ClipboardList, Briefcase, Map, Tag, Plug,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin',                   label: 'Home',                      icon: Home,          end: true },
  { to: '/admin/rutas',             label: 'Rutas',                     icon: Map },
  { to: '/admin/empresas',          label: 'Empresas',                  icon: Briefcase },
  { to: '/admin/clientes',          label: 'Usuarios',                  icon: Users },
  { to: '/admin/centros-de-costos', label: 'Categorías Producto',        icon: FolderOpen },
  { to: '/admin/catalogo',          label: 'Catálogo',                  icon: Package },
  { to: '/admin/listas-precios',    label: 'Listas de precios',         icon: ListOrdered },
  { to: '/admin/promociones',       label: 'Promociones',               icon: Tag },
  { to: '/admin/cotizaciones',           label: 'Trabajar cotizaciones',          icon: ClipboardList },
  { to: '/admin/asesores',          label: 'Asesores',                  icon: UserCog },
  { to: '/admin/integraciones',     label: 'Integraciones (SIIGO)',     icon: Plug },
];

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-700/50 flex flex-col transform transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-700/50">
          <img
            src={logo}
            alt="Logo"
            className="h-9 w-auto object-contain"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 text-xs font-bold flex-shrink-0">
              {currentUser?.initials}
            </div>
            <div className="min-w-0">
              <p className="text-gray-100 text-sm font-semibold truncate">{currentUser?.name}</p>
              <p className="text-gray-500 text-xs truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 hover:bg-red-950 text-sm w-full px-2 py-1.5 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-blue-400 border border-gray-700'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-gray-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-100">Panel de Administración</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">{currentUser?.name}</span>
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
