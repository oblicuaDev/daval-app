import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { siigoApi } from '../api/modules/siigo.js';

export const siigoKeys = {
  settings:        ['siigo', 'settings'],
  status:          ['siigo', 'sync', 'status'],
  logs:            (limit) => ['siigo', 'sync', 'logs', limit],
  customers:       (params) => ['siigo', 'customers', 'preview', params],
  customersLocal:  (params) => ['siigo', 'customers', 'local', params],
  customerHistory: (companyId) => ['siigo', 'customers', companyId, 'history'],
};

export function useSiigoSettings() {
  return useQuery({
    queryKey: siigoKeys.settings,
    queryFn: siigoApi.getSettings,
  });
}

export function useSaveSiigoSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: siigoApi.saveSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: siigoKeys.settings }),
  });
}

export function useTestSiigoConnection() {
  return useMutation({ mutationFn: siigoApi.testConnection });
}

/**
 * Estado de la sincronización. Hace polling cada 3s mientras corre.
 */
export function useSiigoSyncStatus() {
  return useQuery({
    queryKey: siigoKeys.status,
    queryFn: siigoApi.getSyncStatus,
    refetchInterval: (query) => (query.state.data?.running ? 3_000 : false),
  });
}

export function useStartSiigoSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: siigoApi.startSync,
    onSuccess: () => qc.invalidateQueries({ queryKey: siigoKeys.status }),
  });
}

export function useSiigoLogs(limit = 50) {
  return useQuery({
    queryKey: siigoKeys.logs(limit),
    queryFn: () => siigoApi.getSyncLogs(limit),
  });
}

// ── Clientes SIIGO ─────────────────────────────────────────────────────────────

export function useSiigoCustomerPreview(params = {}) {
  return useQuery({
    queryKey: siigoKeys.customers(params),
    queryFn:  () => siigoApi.previewCustomers(params),
    enabled:  true,
    staleTime: 30_000,
  });
}

export function useLocalCompaniesSyncStatus(params = {}) {
  return useQuery({
    queryKey: siigoKeys.customersLocal(params),
    queryFn:  () => siigoApi.getLocalCompaniesSyncStatus(params),
    staleTime: 15_000,
  });
}

export function useCustomerIntegrationHistory(companyId) {
  return useQuery({
    queryKey: siigoKeys.customerHistory(companyId),
    queryFn:  () => siigoApi.getCustomerHistory(companyId),
    enabled:  !!companyId,
  });
}

export function useImportSiigoCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: siigoApi.importCustomer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siigo', 'customers'] });
    },
  });
}

export function useImportSiigoBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: siigoApi.importBatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siigo', 'customers'] });
    },
  });
}

export function useExportCompanyToSiigo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: siigoApi.exportCompany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siigo', 'customers'] });
    },
  });
}
