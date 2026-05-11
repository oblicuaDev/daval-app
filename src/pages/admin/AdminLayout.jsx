import logo from '../../logo-daval.jpeg';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, Package, FolderOpen, ListOrdered, Users,
  UserCog, LogOut, Menu, X, ClipboardList, Briefcase, Map, Tag, Plug,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/admin', label: 'Inicio', icon: Home, end: true },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/admin/rutas',             label: 'Rutas',         icon: Map },
      { to: '/admin/empresas',          label: 'Empresas',      icon: Briefcase },
      { to: '/admin/clientes',          label: 'Usuarios',      icon: Users },
      { to: '/admin/cotizaciones',      label: 'Cotizaciones',  icon: ClipboardList },
      { to: '/admin/asesores',          label: 'Asesores',      icon: UserCog },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { to: '/admin/centros-de-costos', label: 'Categorías',       icon: FolderOpen },
      { to: '/admin/catalogo',          label: 'Productos',         icon: Package },
      { to: '/admin/listas-precios',    label: 'Listas de precios', icon: ListOrdered },
      { to: '/admin/promociones',       label: 'Promociones',       icon: Tag },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/admin/integraciones', label: 'Integraciones', icon: Plug },
    ],
  },
];

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-12 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 bg-zinc-800 ring-1 ring-white/10">
            <img src={logo} alt="DAVAL" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">DAVAL</span>
          <span className="hidden lg:inline text-xs text-zinc-600 font-medium">Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden btn-ghost p-1.5 -mr-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            <div className="space-y-px">
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'nav-item-active' : ''}`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0 opacity-75" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="flex-shrink-0 px-2 pb-3 pt-2 border-t border-zinc-800/60">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-brand-800/40">
            {currentUser?.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">{currentUser?.name}</p>
            <p className="text-[10px] text-zinc-600 truncate">{currentUser?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-item w-full mt-0.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">

      {/* Sidebar — desktop */}
      <aside
        className="hidden lg:flex w-[220px] flex-col flex-shrink-0 border-r border-zinc-800/60 bg-zinc-950"
        aria-label="Menú de administración"
        role="navigation"
      >
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col bg-zinc-950 border-r border-zinc-800 lg:hidden animate-slide-in-right" style={{ animationDirection: 'reverse' }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden h-12 flex items-center gap-3 px-4 border-b border-zinc-800/60 bg-zinc-950 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost p-1.5 -ml-1"
            aria-label="Abrir menú de navegación"
            aria-expanded={sidebarOpen}
            aria-controls="sidebar-mobile"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded overflow-hidden bg-zinc-800">
              <img src={logo} alt="DAVAL" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">DAVAL</span>
          </div>
          <div className="flex-1" />
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
            {currentUser?.initials}
          </div>
        </header>

        {/* Content */}
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="max-w-[1400px] mx-auto p-5 lg:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
