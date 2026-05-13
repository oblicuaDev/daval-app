import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { priceListsApi } from '../api/modules/priceLists.js';

export const priceListKeys = {
  all: ['price-lists'],
  products: (id) => ['price-lists', id, 'products'],
};

export function usePriceLists() {
  return useQuery({ queryKey: priceListKeys.all, queryFn: priceListsApi.list });
}
export function usePriceListProducts(id) {
  return useQuery({
    queryKey: priceListKeys.products(id),
    queryFn: () => priceListsApi.getProducts(id),
    enabled: !!id,
  });
}
export function useCreatePriceList() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: priceListsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: priceListKeys.all }) });
}
export function useUpdatePriceList() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }) => priceListsApi.update(id, body), onSuccess: () => qc.invalidateQueries({ queryKey: priceListKeys.all }) });
}
export function useDeletePriceList() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: priceListsApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: priceListKeys.all }) });
}
export function useSetPriceListProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }) => priceListsApi.setProducts(id, items),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: priceListKeys.products(vars.id) }),
  });
}
