import { apiClient } from '../client.js';

export const routesApi = {
  list: () => apiClient.get('/routes').then(r => r.data.items),
  myCutoff: () => apiClient.get('/routes/me/cutoff').then(r => r.data),
  create: (body) => apiClient.post('/routes', body).then(r => r.data),
  update: (id, body) => apiClient.put(`/routes/${id}`, body).then(r => r.data),
  remove: (id) => apiClient.delete(`/routes/${id}`),
};
