import { apiClient } from '../client.js';

export const usersApi = {
  list: (params = {}) => apiClient.get('/users', { params }).then(r => r.data.items),
  create: (body) => apiClient.post('/users', body).then(r => r.data),
  update: (id, body) => apiClient.put(`/users/${id}`, body).then(r => r.data),
  deactivate: (id) => apiClient.delete(`/users/${id}`),
};
