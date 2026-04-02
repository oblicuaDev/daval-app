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
import AdminBranches from './pages/admin/AdminBranches';
import AdminUsers from './pages/admin/AdminUsers';
import ClientLayout from './pages/client/ClientLayout';
import ClientCatalog from './pages/client/ClientCatalog';
import ClientOrders from './pages/client/ClientOrders';
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
            <Route path="productos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="listas-precios" element={<AdminPriceLists />} />
            <Route path="clientes" element={<AdminClients />} />
            <Route path="sedes" element={<AdminBranches />} />
            <Route path="usuarios" element={<AdminUsers />} />
          </Route>
          <Route
            path="/cliente"
            element={
              <ProtectedRoute allowedRole="client">
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientCatalog />} />
            <Route path="pedidos" element={<ClientOrders />} />
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
            <Route path="pedido/:orderId" element={<AdvisorOrderDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  );
}
