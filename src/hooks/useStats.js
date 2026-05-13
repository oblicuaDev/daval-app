import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/modules/stats.js';

export function useAdminStats(params = {}) {
  return useQuery({
    queryKey: ['stats', 'admin', params],
    queryFn: () => statsApi.admin(params),
  });
}

export function useAdvisorStats(params = {}) {
  return useQuery({
    queryKey: ['stats', 'advisor', params],
    queryFn: () => statsApi.advisor(params),
  });
}
