import axios from 'axios';

const TOKEN_KEY = 'daval.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error envelope so hooks/components don't parse axios shapes.
export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      tokenStore.clear();
      // Bubble up; useAuth listens via React Query and clears user.
      window.dispatchEvent(new CustomEvent('daval:logout'));
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
