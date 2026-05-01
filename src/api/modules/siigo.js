import { apiClient } from '../client.js';

export const siigoApi = {
  getSettings:    () => apiClient.get('/integrations/siigo/settings').then(r => r.data),
  saveSettings:   (body) => apiClient.put('/integrations/siigo/settings', body).then(r => r.data),
  testConnection: () => apiClient.post('/integrations/siigo/test-connection').then(r => r.data),
  startSync:      () => apiClient.post('/integrations/siigo/sync/products').then(r => r.data),
  getSyncStatus:  () => apiClient.get('/integrations/siigo/sync/status').then(r => r.data),
  getSyncLogs:    (limit = 50) =>
    apiClient.get('/integrations/siigo/sync/logs', { params: { limit } }).then(r => r.data.items),
};
