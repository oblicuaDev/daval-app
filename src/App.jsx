import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPriceLists from './pages/admin/AdminPriceLists';
import AdminClients from './pages/admin/AdminClients';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminRoutes from './pages/admin/AdminRoutes';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminIntegrations from './pages/admin/AdminIntegrations';
import ClientLayout from './pages/client/ClientLayout';
import ClientStart from './pages/client/ClientStart';
import ClientCatalog from './pages/client/ClientCatalog';
import ClientOrders from './pages/client/ClientOrders';
import ClientConfirmOrder from './pages/client/ClientConfirmOrder';
import ClientOrderDetail from './pages/client/ClientOrderDetail';
import ClientManage from './pages/client/ClientManage';
import AdvisorLayout from './pages/advisor/AdvisorLayout';
import AdvisorOrders from './pages/advisor/AdvisorOrders';
import AdvisorOrderDetail from './pages/advisor/AdvisorOrderDetail';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="catalogo" element={<AdminProducts />} />
            <Route path="centros-de-costos" element={<AdminCategories />} />
            <Route path="listas-precios" element={<AdminPriceLists />} />
            <Route path="promociones" element={<AdminPromotions />} />
            <Route path="cotizaciones/:orderId" element={<AdminOrderDetail />} />
            <Route path="pedidos/:orderId" element={<AdminOrderDetail />} />
            <Route path="empresas" element={<AdminCompanies />} />
            <Route path="clientes" element={<AdminClients />} />
            <Route path="cotizaciones" element={<AdminOrders />} />
            <Route path="pedidos" element={<Navigate to="../cotizaciones" replace />} />
            <Route path="rutas" element={<AdminRoutes />} />
            <Route path="asesores" element={<AdminUsers />} />
            <Route path="integraciones" element={<AdminIntegrations />} />
          </Route>
          <Route
            path="/cliente"
            element={
              <ProtectedRoute allowedRole="client">
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientStart />} />
            <Route path="catalogo" element={<ClientCatalog />} />
            <Route path="cotizaciones" element={<ClientOrders />} />
            <Route path="pedidos" element={<Navigate to="../cotizaciones" replace />} />
            <Route path="confirmar-cotizacion" element={<ClientConfirmOrder />} />
            <Route path="confirmar-pedido" element={<Navigate to="../confirmar-cotizacion" replace />} />
            <Route path="aprobar-cotizaciones" element={<Navigate to="../cotizaciones" replace />} />
            <Route path="aprobar-pedidos" element={<Navigate to="../cotizaciones" replace />} />
            <Route path="cotizaciones/:orderId" element={<ClientOrderDetail />} />
            <Route path="pedidos/:orderId" element={<ClientOrderDetail />} />
            <Route path="administrar" element={<ClientManage />} />
          </Route>
          <Route
            path="/asesor"
            element={
              <ProtectedRoute allowedRole="advisor">
                <AdvisorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdvisorOrders />} />
            <Route path="cotizacion/:orderId" element={<AdvisorOrderDetail />} />
            <Route path="pedido/:orderId" element={<AdvisorOrderDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  );
}
