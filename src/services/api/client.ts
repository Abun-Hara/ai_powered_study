import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

function onTokenRefreshed(nextToken: string | null) {
  pendingRequests.forEach((callback) => callback(nextToken));
  pendingRequests = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const store = useAuthStore.getState();

  if (!store.refreshToken) {
    return null;
  }

  try {
    const response = await authApi.post('/auth/refresh', { refreshToken: store.refreshToken });
    const nextAccess = response.data?.accessToken as string | undefined;
    const nextRefresh = (response.data?.refreshToken as string | undefined) ?? store.refreshToken;

    if (!nextAccess || !store.user) {
      return null;
    }

    useAuthStore.getState().setSession({
      user: store.user,
      accessToken: nextAccess,
      refreshToken: nextRefresh,
      rememberMe: store.persistMode === 'local',
    });

    return nextAccess;
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((token) => {
          if (!token) {
            reject(error);
            return;
          }

          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;
    const nextToken = await refreshAccessToken();
    isRefreshing = false;
    onTokenRefreshed(nextToken);

    if (!nextToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${nextToken}`;
    return api(originalRequest);
  }
);