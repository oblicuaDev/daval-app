import { apiClient } from '../client.js';

export const routesApi = {
  list: () => apiClient.get('/routes').then(r => r.data.items),
  myCutoff: () => apiClient.get('/routes/me/cutoff').then(r => r.data),
};
