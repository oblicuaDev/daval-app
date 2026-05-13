import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';

const categoriesApi = {
  list: () => apiClient.get('/categories').then(r => r.data.items),
  create: (body) => apiClient.post('/categories', body).then(r => r.data),
  update: (id, body) => apiClient.put(`/categories/${id}`, body).then(r => r.data),
  remove: (id) => apiClient.delete(`/categories/${id}`),
};

export const categoryKeys = { all: ['categories'] };

export function useCategories() {
  return useQuery({ queryKey: categoryKeys.all, queryFn: categoriesApi.list });
}
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: categoriesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }) });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }) => categoriesApi.update(id, body), onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }) });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: categoriesApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }) });
}
