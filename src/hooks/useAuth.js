import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/modules/auth.js';
import { tokenStore } from '../api/client.js';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!tokenStore.get(),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }) => authApi.login(email, password),
    onSuccess: ({ token, user }) => {
      tokenStore.set(token);
      qc.setQueryData(['auth', 'me'], user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return () => {
    tokenStore.clear();
    qc.clear();
  };
}

/** Bind to the global 401 event so any expired token forces logout app-wide. */
export function useGlobalAuthGuard() {
  const logout = useLogout();
  useEffect(() => {
    const onLogout = () => logout();
    window.addEventListener('daval:logout', onLogout);
    return () => window.removeEventListener('daval:logout', onLogout);
  }, [logout]);
}
