import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {
  isSensorAvailable,
  simplePrompt,
} from '@sbaiahmed1/react-native-biometrics';
import { login as apiLogin, logout as apiLogout } from '../api/auth';
import { getStoredTokens, clearTokens } from '../api/client';
import { STORAGE_KEYS } from '../constants';
import { notificationService } from '../services/notifications';
import type { User } from '../types';

export type BiometricType = 'FaceID' | 'TouchID' | 'Biometrics' | null;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricEnabled: boolean;
  isBiometricAvailable: boolean;
  biometricType: BiometricType;
  hasStoredSession: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: (fullLogout?: boolean) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  checkBiometricAvailability: () => Promise<void>;
  checkStoredSession: () => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
  clearError: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isBiometricEnabled: false,
      isBiometricAvailable: false,
      biometricType: null,
      hasStoredSession: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { user } = await apiLogin(email, password);

          // Store user data securely in Keychain as backup
          await Keychain.setGenericPassword('user', JSON.stringify(user), {
            service: STORAGE_KEYS.USER,
          });

          // Check biometric availability after login
          await get().checkBiometricAvailability();

          // Check if biometric was previously enabled
          const biometricEnabled = await Keychain.getGenericPassword({
            service: STORAGE_KEYS.BIOMETRIC_ENABLED,
          });

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isBiometricEnabled: !!biometricEnabled,
            hasStoredSession: true,
            error: null,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      logout: async (fullLogout = false) => {
        set({ isLoading: true });

        const { isBiometricEnabled } = get();

        // If biometric is enabled and not a full logout, just lock the session
        if (isBiometricEnabled && !fullLogout) {
          set({
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        // Full logout - clear everything
        try {
          await apiLogout();
        } catch {
          // Ignore logout API errors
        }

        // Reset notification service
        try {
          await notificationService.reset();
        } catch {
          // Ignore notification reset errors
        }

        // Clear all stored data
        await Keychain.resetGenericPassword({ service: STORAGE_KEYS.USER });
        await clearTokens();

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          hasStoredSession: false,
          error: null,
        });
      },

      checkAuth: async () => {
        set({ isLoading: true });

        try {
          const { accessToken } = await getStoredTokens();

          // Check biometric availability
          await get().checkBiometricAvailability();

          if (!accessToken) {
            await get().checkStoredSession();
            set({ isAuthenticated: false, isLoading: false });
            return false;
          }

          // Get stored user from Keychain
          const userResult = await Keychain.getGenericPassword({
            service: STORAGE_KEYS.USER,
          });

          if (!userResult) {
            set({ isAuthenticated: false, isLoading: false });
            return false;
          }

          // Check if biometric is enabled
          const biometricEnabled = await Keychain.getGenericPassword({
            service: STORAGE_KEYS.BIOMETRIC_ENABLED,
          });

          // If biometric is enabled, don't auto-authenticate
          if (biometricEnabled) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isBiometricEnabled: true,
              hasStoredSession: true,
            });
            return false;
          }

          // No biometric - auto-authenticate with stored session
          const user = JSON.parse(userResult.password) as User;
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isBiometricEnabled: false,
            hasStoredSession: true,
          });
          return true;
        } catch {
          set({ isAuthenticated: false, isLoading: false });
          return false;
        }
      },

      checkStoredSession: async () => {
        try {
          const { accessToken } = await getStoredTokens();
          const userResult = await Keychain.getGenericPassword({
            service: STORAGE_KEYS.USER,
          });
          const biometricEnabled = await Keychain.getGenericPassword({
            service: STORAGE_KEYS.BIOMETRIC_ENABLED,
          });

          set({
            hasStoredSession: !!accessToken && !!userResult,
            isBiometricEnabled: !!biometricEnabled,
          });
        } catch {
          set({ hasStoredSession: false });
        }
      },

      checkBiometricAvailability: async () => {
        try {
          const sensorInfo = await isSensorAvailable();

          let type: BiometricType = null;
          if (sensorInfo.available && sensorInfo.biometryType) {
            switch (sensorInfo.biometryType) {
              case 'FaceID':
                type = 'FaceID';
                break;
              case 'TouchID':
                type = 'TouchID';
                break;
              case 'Biometrics':
                type = 'Biometrics';
                break;
            }
          }

          set({
            isBiometricAvailable: sensorInfo.available,
            biometricType: type,
          });
        } catch {
          set({
            isBiometricAvailable: false,
            biometricType: null,
          });
        }
      },

      enableBiometric: async () => {
        try {
          const sensorInfo = await isSensorAvailable();

          if (!sensorInfo.available) {
            set({ error: 'Biometric authentication not available on this device' });
            return false;
          }

          // Prompt user to authenticate with biometrics to confirm
          const result = await simplePrompt('Confirm to enable biometric login');

          if (!result.success) {
            set({ error: 'Biometric authentication cancelled' });
            return false;
          }

          // Store a flag that biometric is enabled
          await Keychain.setGenericPassword('enabled', 'true', {
            service: STORAGE_KEYS.BIOMETRIC_ENABLED,
            accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
          });

          set({ isBiometricEnabled: true, error: null });
          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to enable biometric';
          set({ error: message });
          return false;
        }
      },

      disableBiometric: async () => {
        try {
          await Keychain.resetGenericPassword({
            service: STORAGE_KEYS.BIOMETRIC_ENABLED,
          });
          set({ isBiometricEnabled: false });
        } catch {
          // Ignore errors
        }
      },

      authenticateWithBiometric: async () => {
        try {
          // Check if biometric is enabled
          const biometricEnabled = await Keychain.getGenericPassword({
            service: STORAGE_KEYS.BIOMETRIC_ENABLED,
          });

          if (!biometricEnabled) {
            console.log('[Auth] Biometric not enabled');
            return false;
          }

          // Check if we have valid tokens
          const { accessToken } = await getStoredTokens();
          if (!accessToken) {
            console.log('[Auth] No stored access token');
            return false;
          }

          // Check if we have stored user data
          const userResult = await Keychain.getGenericPassword({
            service: STORAGE_KEYS.USER,
          });

          if (!userResult) {
            console.log('[Auth] No stored user data');
            return false;
          }

          // Prompt for biometric authentication
          const result = await simplePrompt('Unlock FieldPulse');

          if (result.success) {
            const user = JSON.parse(userResult.password) as User;
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              hasStoredSession: true,
            });
            console.log('[Auth] Biometric authentication successful');
            return true;
          }

          console.log('[Auth] Biometric prompt failed or cancelled');
          return false;
        } catch (error) {
          console.log('[Auth] Biometric error:', error);
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-sensitive state (tokens stay in Keychain)
      partialize: (state: AuthState) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isBiometricEnabled: state.isBiometricEnabled,
        hasStoredSession: state.hasStoredSession,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Helper to wait for hydration
export const waitForHydration = (): Promise<void> => {
  return new Promise((resolve) => {
    if (useAuthStore.getState()._hasHydrated) {
      resolve();
      return;
    }
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state._hasHydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
};
