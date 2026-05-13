import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '../api/modules/companies.js';

export const companyKeys = { all: ['companies'] };

export function useCompanies() {
  return useQuery({ queryKey: companyKeys.all, queryFn: companiesApi.list });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: companiesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }) });
}
export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }) => companiesApi.update(id, body), onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }) });
}
export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: companiesApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }) });
}
export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ companyId, body }) => companiesApi.createBranch(companyId, body), onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }) });
}
export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ companyId, branchId, body }) => companiesApi.updateBranch(companyId, branchId, body), onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }) });
}
export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ companyId, branchId }) => companiesApi.removeBranch(companyId, branchId), onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }) });
}
