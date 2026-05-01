import { apiClient } from '../client.js';

export const productsApi = {
  list: (params = {}) =>
    apiClient.get('/products', { params }).then(r => r.data.items),
  create: (body) =>
    apiClient.post('/products', body).then(r => r.data),
  update: (id, body) =>
    apiClient.put(`/products/${id}`, body).then(r => r.data),
};
