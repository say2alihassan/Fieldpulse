import { apiClient, storeTokens, clearTokens } from './client';
import type { LoginRequest, LoginResponse, User } from '../types';

export async function login(
  email: string,
  password: string
): Promise<{ user: User }> {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    password,
  } as LoginRequest);

  const { accessToken, refreshToken, user } = response.data;
  await storeTokens(accessToken, refreshToken);

  return { user };
}

export async function logout(): Promise<void> {
  try {
    const { refreshToken } = await import('./client').then((m) =>
      m.getStoredTokens()
    );
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken });
    }
  } catch {
    // Ignore errors during logout
  } finally {
    await clearTokens();
  }
}

export async function refreshTokens(): Promise<boolean> {
  try {
    const { refreshToken } = await import('./client').then((m) =>
      m.getStoredTokens()
    );

    if (!refreshToken) {
      return false;
    }

    const response = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', { refreshToken });

    await storeTokens(response.data.accessToken, response.data.refreshToken);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}
