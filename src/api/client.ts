import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as Keychain from 'react-native-keychain';
import { API_CONFIG, STORAGE_KEYS } from '../constants';

const apiClient = axios.create({
  baseURL:API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh state
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function getStoredTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  try {
    const accessResult = await Keychain.getGenericPassword({
      service: STORAGE_KEYS.ACCESS_TOKEN,
    });
    const refreshResult = await Keychain.getGenericPassword({
      service: STORAGE_KEYS.REFRESH_TOKEN,
    });

    return {
      accessToken: accessResult ? accessResult.password : null,
      refreshToken: refreshResult ? refreshResult.password : null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

async function storeTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await Keychain.setGenericPassword('token', accessToken, {
    service: STORAGE_KEYS.ACCESS_TOKEN,
  });
  await Keychain.setGenericPassword('token', refreshToken, {
    service: STORAGE_KEYS.REFRESH_TOKEN,
  });
}

async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: STORAGE_KEYS.ACCESS_TOKEN });
  await Keychain.resetGenericPassword({ service: STORAGE_KEYS.REFRESH_TOKEN });
}

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken } = await getStoredTokens();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = await getStoredTokens();

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Use the same base URL as apiClient
        const baseUrl = apiClient.defaults.baseURL || API_CONFIG.BASE_URL;
        const response = await axios.post(
          `${baseUrl}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        await storeTokens(newAccessToken, newRefreshToken);
        onTokenRefreshed(newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Only logout if refresh token is actually invalid (401/403), not for network errors
        const isAuthError = refreshError instanceof AxiosError &&
          (refreshError.response?.status === 401 || refreshError.response?.status === 403);

        if (isAuthError) {
          console.log('[Auth] Refresh token expired or invalid, logging out');
          await clearTokens();
          // Force logout - reset auth state when refresh fails
          const { useAuthStore } = await import('../store/authStore');
          useAuthStore.getState().logout(true);
        } else {
          console.log('[Auth] Token refresh failed due to network error, keeping session');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient, getStoredTokens, storeTokens, clearTokens };
