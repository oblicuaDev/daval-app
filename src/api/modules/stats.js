import { apiClient } from '../client.js';

export const statsApi = {
  admin: (params = {}) => apiClient.get('/stats/admin', { params }).then(r => r.data),
  advisor: (params = {}) => apiClient.get('/stats/advisor', { params }).then(r => r.data),
};
