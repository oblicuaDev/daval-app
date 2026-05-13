import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { promotionsApi } from '../api/modules/promotions.js';

export const promotionKeys = { all: ['promotions'] };

export function usePromotions() {
  return useQuery({ queryKey: promotionKeys.all, queryFn: promotionsApi.list });
}
export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: promotionsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: promotionKeys.all }) });
}
export function useUpdatePromotion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }) => promotionsApi.update(id, body), onSuccess: () => qc.invalidateQueries({ queryKey: promotionKeys.all }) });
}
export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: promotionsApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: promotionKeys.all }) });
}
