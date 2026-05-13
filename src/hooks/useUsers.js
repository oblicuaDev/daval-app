import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/modules/users.js';

export const userKeys = {
  all: ['users'],
  list: (params) => ['users', 'list', params ?? {}],
};

export function useUsers(params = {}) {
  return useQuery({ queryKey: userKeys.list(params), queryFn: () => usersApi.list(params) });
}
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: usersApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }) });
}
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }) => usersApi.update(id, body), onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }) });
}
export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: usersApi.deactivate, onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }) });
}
