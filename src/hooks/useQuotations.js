import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotationsApi } from '../api/modules/quotations.js';

export const quotationKeys = {
  all: ['quotations'],
  list: (filters) => ['quotations', 'list', filters ?? {}],
  detail: (id) => ['quotations', 'detail', id],
};

export function useQuotations(filters = {}) {
  return useQuery({
    queryKey: quotationKeys.list(filters),
    queryFn: () => quotationsApi.list(filters),
  });
}

export function useQuotation(id) {
  return useQuery({
    queryKey: quotationKeys.detail(id),
    queryFn: () => quotationsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: quotationKeys.all }),
  });
}

export function useAddComment(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text) => quotationsApi.addComment(id, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: quotationKeys.detail(id) }),
  });
}

export function usePatchStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => quotationsApi.patchStatus(id, status),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: quotationKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
}

export function useSendToSiigo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.sendToSiigo,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      qc.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
}
