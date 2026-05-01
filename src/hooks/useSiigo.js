import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { siigoApi } from '../api/modules/siigo.js';

export const siigoKeys = {
  settings: ['siigo', 'settings'],
  status:   ['siigo', 'sync', 'status'],
  logs:     (limit) => ['siigo', 'sync', 'logs', limit],
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
