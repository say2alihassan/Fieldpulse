import React, { useEffect } from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';
import { notificationService } from '../services/notifications';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { UI } from '../constants';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Create navigation ref for use outside of React components
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Helper function to navigate from anywhere
export function navigate<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T]
): void {
  if (navigationRef.isReady()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigationRef.navigate as any)(name, params);
  }
}

export default function RootNavigator(): React.JSX.Element {
  // Auth state is automatically restored from AsyncStorage via Zustand persist
  const { isAuthenticated, _hasHydrated, checkBiometricAvailability } = useAuthStore();
  const { initializeSync } = useSyncStore();

  // Check biometric availability after hydration (not persisted, needs runtime check)
  useEffect(() => {
    if (_hasHydrated) {
      checkBiometricAvailability();
    }
  }, [_hasHydrated, checkBiometricAvailability]);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      initializeSync();
      notificationService.initialize().catch(console.error);
    }
  }, [_hasHydrated, isAuthenticated, initializeSync]);

  // Show loading while hydrating persisted state
  if (!_hasHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UI.COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI.COLORS.background,
  },
});
