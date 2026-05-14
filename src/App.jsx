import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';

// ── Lazy imports (route-level code splitting) ──────────────────────────────
// Each role loads only its own chunk on first navigation to that section.

const Login = lazy(() => import('./pages/Login'));

// Admin role
const AdminLayout       = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts     = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories   = lazy(() => import('./pages/admin/AdminCategories'));
const AdminPriceLists   = lazy(() => import('./pages/admin/AdminPriceLists'));
const AdminClients      = lazy(() => import('./pages/admin/AdminClients'));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrders       = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail  = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminCompanies    = lazy(() => import('./pages/admin/AdminCompanies'));
const AdminRoutes       = lazy(() => import('./pages/admin/AdminRoutes'));
const AdminPromotions   = lazy(() => import('./pages/admin/AdminPromotions'));
const AdminIntegrations     = lazy(() => import('./pages/admin/AdminIntegrations'));
const AdminSiigoCustomers   = lazy(() => import('./pages/admin/AdminSiigoCustomers'));

// Client role
const ClientLayout       = lazy(() => import('./pages/client/ClientLayout'));
const ClientStart        = lazy(() => import('./pages/client/ClientStart'));
const ClientCatalog      = lazy(() => import('./pages/client/ClientCatalog'));
const ClientOrders       = lazy(() => import('./pages/client/ClientOrders'));
const ClientConfirmOrder = lazy(() => import('./pages/client/ClientConfirmOrder'));
const ClientOrderDetail  = lazy(() => import('./pages/client/ClientOrderDetail'));
const ClientManage       = lazy(() => import('./pages/client/ClientManage'));

// Advisor role
const AdvisorLayout      = lazy(() => import('./pages/advisor/AdvisorLayout'));
const AdvisorOrders      = lazy(() => import('./pages/advisor/AdvisorOrders'));
const AdvisorOrderDetail = lazy(() => import('./pages/advisor/AdvisorOrderDetail'));

// ── Full-page loader shown during chunk fetch ──────────────────────────────
function PageLoader() {
  return (
    <div
      className="min-h-screen bg-zinc-950 flex items-center justify-center"
      role="status"
      aria-label="Cargando página"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-800 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-xs text-zinc-600 select-none">Cargando…</p>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        {/* Single Suspense boundary — catches any lazy-loaded route */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index                      element={<AdminDashboard />} />
              <Route path="catalogo"            element={<AdminProducts />} />
              <Route path="centros-de-costos"   element={<AdminCategories />} />
              <Route path="listas-precios"      element={<AdminPriceLists />} />
              <Route path="promociones"         element={<AdminPromotions />} />
              <Route path="cotizaciones/:orderId" element={<AdminOrderDetail />} />
              <Route path="pedidos/:orderId"    element={<AdminOrderDetail />} />
              <Route path="empresas"            element={<AdminCompanies />} />
              <Route path="clientes"            element={<AdminClients />} />
              <Route path="cotizaciones"        element={<AdminOrders />} />
              <Route path="pedidos"             element={<Navigate to="../cotizaciones" replace />} />
              <Route path="rutas"               element={<AdminRoutes />} />
              <Route path="asesores"            element={<AdminUsers />} />
              <Route path="integraciones"                    element={<AdminIntegrations />} />
              <Route path="integraciones/clientes-siigo"   element={<AdminSiigoCustomers />} />
            </Route>

            {/* Client */}
            <Route
              path="/cliente"
              element={
                <ProtectedRoute allowedRole="client">
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route index                        element={<ClientStart />} />
              <Route path="catalogo"              element={<ClientCatalog />} />
              <Route path="cotizaciones"          element={<ClientOrders />} />
              <Route path="pedidos"               element={<Navigate to="../cotizaciones" replace />} />
              <Route path="confirmar-cotizacion"  element={<ClientConfirmOrder />} />
              <Route path="confirmar-pedido"      element={<Navigate to="../confirmar-cotizacion" replace />} />
              <Route path="aprobar-cotizaciones"  element={<Navigate to="../cotizaciones" replace />} />
              <Route path="aprobar-pedidos"       element={<Navigate to="../cotizaciones" replace />} />
              <Route path="cotizaciones/:orderId" element={<ClientOrderDetail />} />
              <Route path="pedidos/:orderId"      element={<ClientOrderDetail />} />
              <Route path="administrar"           element={<ClientManage />} />
            </Route>

            {/* Advisor */}
            <Route
              path="/asesor"
              element={
                <ProtectedRoute allowedRole="advisor">
                  <AdvisorLayout />
                </ProtectedRoute>
              }
            >
              <Route index                       element={<AdvisorOrders />} />
              <Route path="cotizacion/:orderId"  element={<AdvisorOrderDetail />} />
              <Route path="pedido/:orderId"      element={<AdvisorOrderDetail />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AppProvider>
    </AuthProvider>
  );
}
