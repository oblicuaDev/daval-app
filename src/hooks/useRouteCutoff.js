import { useQuery } from '@tanstack/react-query';
import { routesApi } from '../api/modules/routes.js';

/**
 * Server-authoritative cutoff. UI must NOT compute isOpen client-side.
 * Refetch every 60s so the badge stays accurate near the deadline.
 */
export function useRouteCutoff() {
  return useQuery({
    queryKey: ['routes', 'me', 'cutoff'],
    queryFn: routesApi.myCutoff,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
