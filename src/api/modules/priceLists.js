import { apiClient } from '../client.js';

export const priceListsApi = {
  list: () => apiClient.get('/price-lists').then(r => r.data.items),
  create: (body) => apiClient.post('/price-lists', body).then(r => r.data),
  update: (id, body) => apiClient.put(`/price-lists/${id}`, body).then(r => r.data),
  remove: (id) => apiClient.delete(`/price-lists/${id}`),
  getProducts: (id) => apiClient.get(`/price-lists/${id}/products`).then(r => r.data.items),
  setProducts: (id, items) => apiClient.post(`/price-lists/${id}/products`, { items }).then(r => r.data),
};
