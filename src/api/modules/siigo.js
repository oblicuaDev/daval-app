import { apiClient } from '../client.js';

export const siigoApi = {
  // ── Configuración ──────────────────────────────────────────────────────────
  getSettings:    () => apiClient.get('/integrations/siigo/settings').then(r => r.data),
  saveSettings:   (body) => apiClient.put('/integrations/siigo/settings', body).then(r => r.data),
  testConnection: () => apiClient.post('/integrations/siigo/test-connection').then(r => r.data),

  // ── Sync productos ─────────────────────────────────────────────────────────
  startSync:      () => apiClient.post('/integrations/siigo/sync/products').then(r => r.data),
  getSyncStatus:  () => apiClient.get('/integrations/siigo/sync/status').then(r => r.data),
  getSyncLogs:    (limit = 50) =>
    apiClient.get('/integrations/siigo/sync/logs', { params: { limit } }).then(r => r.data.items),

  // ── Clientes SIIGO ─────────────────────────────────────────────────────────
  previewCustomers: (params = {}) =>
    apiClient.get('/integrations/siigo/customers', { params }).then(r => r.data),

  getLocalCompaniesSyncStatus: (params = {}) =>
    apiClient.get('/integrations/siigo/customers/local', { params }).then(r => r.data.items),

  importCustomer: (siigoId) =>
    apiClient.post(`/integrations/siigo/customers/import/${siigoId}`).then(r => r.data),

  importBatch: (siigoIds) =>
    apiClient.post('/integrations/siigo/customers/import', { siigoIds }).then(r => r.data),

  exportCompany: (companyId) =>
    apiClient.post(`/integrations/siigo/customers/${companyId}/export`).then(r => r.data),

  getCustomerHistory: (companyId) =>
    apiClient.get(`/integrations/siigo/customers/${companyId}/history`).then(r => r.data.items),
};
