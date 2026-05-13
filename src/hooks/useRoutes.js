import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { routesApi } from '../api/modules/routes.js';

export const routeKeys = { all: ['routes'] };

export function useRoutes() {
  return useQuery({ queryKey: routeKeys.all, queryFn: routesApi.list });
}
export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: routesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: routeKeys.all }) });
}
export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }) => routesApi.update(id, body), onSuccess: () => qc.invalidateQueries({ queryKey: routeKeys.all }) });
}
export function useDeleteRoute() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: routesApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: routeKeys.all }) });
}
