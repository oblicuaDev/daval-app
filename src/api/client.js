import axios from 'axios';

const TOKEN_KEY = 'daval.token';
const REFRESH_KEY = 'daval.refresh_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (t) => localStorage.setItem(REFRESH_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// -- Refresh token queue --
let isRefreshing = false;
let refreshQueue = [];

function flushQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  refreshQueue = [];
}

function forceLogout() {
  tokenStore.clear();
  window.dispatchEvent(new CustomEvent('daval:logout'));
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      const refreshToken = tokenStore.getRefresh();
      const accessToken = tokenStore.get();

      // No tokens at all → mock-auth mode, don't force logout
      if (!refreshToken && !accessToken) {
        // fall through to rejection below
      } else if (!refreshToken) {
        forceLogout();
      } else if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(original);
        });
      } else {
        original._retry = true;
        isRefreshing = true;
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          tokenStore.set(data.token);
          if (data.refreshToken) tokenStore.setRefresh(data.refreshToken);
          flushQueue(null, data.token);
          original.headers.Authorization = `Bearer ${data.token}`;
          return apiClient(original);
        } catch (refreshErr) {
          flushQueue(refreshErr, null);
          forceLogout();
        } finally {
          isRefreshing = false;
        }
      }
    }

    const data = err.response?.data ?? {};
    return Promise.reject(new ApiError({
      status: err.response?.status ?? 0,
      code: data.error ?? 'NETWORK_ERROR',
      message: data.message ?? err.message,
      details: data.details,
    }));
  }
);
