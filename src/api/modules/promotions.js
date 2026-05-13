import { apiClient } from '../client.js';

export const promotionsApi = {
  list: () => apiClient.get('/promotions').then(r => r.data.items),
  create: (body) => apiClient.post('/promotions', body).then(r => r.data),
  update: (id, body) => apiClient.put(`/promotions/${id}`, body).then(r => r.data),
  remove: (id) => apiClient.delete(`/promotions/${id}`),
};
