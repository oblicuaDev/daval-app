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
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 text-gray-100 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1">
              <img
                src={logo}
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="flex gap-1 ml-4">
            <NavLink
              to="/asesor"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-700'
                }`
              }
            >
              <ClipboardList className="w-4 h-4" />
              Mis Cotizaciones
            </NavLink>
          </nav>

          <div className="flex-1" />

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm text-gray-100 font-medium">{currentUser?.name}</p>
              <p className="text-xs text-gray-400">Asesor Comercial</p>
            </div>
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.initials}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
