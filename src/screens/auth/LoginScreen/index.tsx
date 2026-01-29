import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/authStore';
import { UI } from '../../../constants';
import { styles } from './styles';

export default function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [biometricPrompted, setBiometricPrompted] = useState(false);

  const {
    login,
    isLoading,
    error,
    clearError,
    isBiometricEnabled,
    isBiometricAvailable,
    biometricType,
    hasStoredSession,
    authenticateWithBiometric,
    checkBiometricAvailability,
    checkStoredSession,
  } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await checkBiometricAvailability();
      await checkStoredSession();
    };
    init();
  }, [checkBiometricAvailability, checkStoredSession]);

  useEffect(() => {
    if (
      isBiometricEnabled &&
      isBiometricAvailable &&
      hasStoredSession &&
      !biometricPrompted
    ) {
      setBiometricPrompted(true);
    }
  }, [isBiometricEnabled, isBiometricAvailable, hasStoredSession, biometricPrompted]);

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password) {
      return;
    }

    try {
      await login(email.trim(), password);
    } catch {
      // Error is handled in store
    }
  };

  const handleBiometricLogin = useCallback(async (): Promise<void> => {
    try {
      const success = await authenticateWithBiometric();
      if (!success) {
        setBiometricPrompted(true);
      }
    } catch {
      setBiometricPrompted(true);
    }
  }, [authenticateWithBiometric]);

  const handleEmailChange = (text: string): void => {
    setEmail(text);
    if (error) clearError();
  };

  const handlePasswordChange = (text: string): void => {
    setPassword(text);
    if (error) clearError();
  };

  const getBiometricLabel = (): string => {
    switch (biometricType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Biometrics':
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  };

  const getBiometricIcon = (): string => {
    switch (biometricType) {
      case 'FaceID':
        return '👤';
      case 'TouchID':
      case 'Biometrics':
        return '👆';
      default:
        return '🔐';
    }
  };

  const canUseBiometric = isBiometricEnabled && isBiometricAvailable && hasStoredSession;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>FieldPulse</Text>
            <Text style={styles.subtitle}>Field Service Management</Text>
          </View>

          <View style={styles.form}>
            {canUseBiometric && (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.welcomeSubtext}>
                  Use {getBiometricLabel()} to unlock or sign in with password
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                placeholderTextColor={UI.COLORS.disabled}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="email-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your password"
                placeholderTextColor={UI.COLORS.disabled}
                secureTextEntry
                testID="password-input"
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                (!email.trim() || !password || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!email.trim() || !password || isLoading}
              testID="login-button"
            >
              {isLoading ? (
                <ActivityIndicator color={UI.COLORS.textLight} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {canUseBiometric && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={isLoading}
                testID="biometric-button"
              >
                <Text style={styles.biometricIcon}>{getBiometricIcon()}</Text>
                <Text style={styles.biometricText}>
                  Unlock with {getBiometricLabel()}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Demo: admin@fieldpulse.com|tech@fieldpulse.com / password123
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
