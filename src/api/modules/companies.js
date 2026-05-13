import { apiClient } from '../client.js';

export const companiesApi = {
  list: () => apiClient.get('/companies').then(r => r.data.items),
  create: (body) => apiClient.post('/companies', body).then(r => r.data),
  update: (id, body) => apiClient.put(`/companies/${id}`, body).then(r => r.data),
  remove: (id) => apiClient.delete(`/companies/${id}`),
  createBranch: (companyId, body) => apiClient.post(`/companies/${companyId}/branches`, body).then(r => r.data),
  updateBranch: (companyId, branchId, body) => apiClient.put(`/companies/${companyId}/branches/${branchId}`, body).then(r => r.data),
  removeBranch: (companyId, branchId) => apiClient.delete(`/companies/${companyId}/branches/${branchId}`),
};
