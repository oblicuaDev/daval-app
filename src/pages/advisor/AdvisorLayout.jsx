import logo from '../../logo-daval.jpeg';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdvisorLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* Top bar */}
      <header className="sticky top-0 z-30 h-12 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-md overflow-hidden bg-zinc-800 ring-1 ring-white/10">
              <img src={logo} alt="DAVAL" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">DAVAL</span>
            <span className="hidden sm:inline text-xs text-zinc-600">·</span>
            <span className="hidden sm:inline text-xs text-zinc-500">Asesor</span>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-zinc-800" />

          {/* Nav */}
          <nav>
            <NavLink
              to="/asesor"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-zinc-50 bg-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`
              }
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Mis Cotizaciones
            </NavLink>
          </nav>

          <div className="flex-1" />

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-zinc-200 leading-none">{currentUser?.name}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">Asesor Comercial</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-brand-800/40">
              {currentUser?.initials}
            </div>
            <button
              onClick={handleLogout}
              className="btn-ghost p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 py-6 animate-fade-in" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
