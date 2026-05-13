import { apiClient } from '../client.js';

export const quotationsApi = {
  list: (params = {}) =>
    apiClient.get('/quotations', { params }).then(r => r.data.items),
  get: (id) =>
    apiClient.get(`/quotations/${id}`).then(r => r.data),
  create: (body) =>
    apiClient.post('/quotations', body).then(r => r.data),
  clone: (id) =>
    apiClient.post(`/quotations/${id}/clone`).then(r => r.data),
  addComment: (id, text) =>
    apiClient.post(`/quotations/${id}/comments`, { text }).then(r => r.data),
  patchStatus: (id, status) =>
    apiClient.patch(`/quotations/${id}/status`, { status }).then(r => r.data),
  update: (id, body) =>
    apiClient.patch(`/quotations/${id}`, body).then(r => r.data),
  sendToSiigo: (id) =>
    apiClient.post(`/quotations/${id}/send-to-siigo`).then(r => r.data),
};
