import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/authStore';
import { useSyncStore } from '../../../store/syncStore';
import { UI } from '../../../constants';
import { styles } from './styles';

export default function SettingsScreen(): React.JSX.Element {
  const {
    user,
    isBiometricEnabled,
    isBiometricAvailable,
    biometricType,
    logout,
    enableBiometric,
    disableBiometric,
  } = useAuthStore();
  const { pendingCount, networkStatus, lastSyncedAt, startSync } = useSyncStore();

  const getBiometricLabel = (): string => {
    switch (biometricType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Biometrics':
        return 'Fingerprint';
      default:
        return 'Biometric Unlock';
    }
  };

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  }, [logout]);

  const handleBiometricToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        await enableBiometric();
      } else {
        await disableBiometric();
      }
    },
    [enableBiometric, disableBiometric]
  );

  const handleSync = useCallback(() => {
    if (networkStatus === 'offline') {
      Alert.alert('Offline', 'Cannot sync while offline');
      return;
    }
    startSync();
  }, [networkStatus, startSync]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.fullName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{user?.role}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          {isBiometricAvailable ? (
            <View style={styles.row}>
              <Text style={styles.label}>{getBiometricLabel()}</Text>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: UI.COLORS.border, true: UI.COLORS.primary }}
              />
            </View>
          ) : (
            <View style={styles.row}>
              <Text style={styles.label}>Biometric Unlock</Text>
              <Text style={styles.valueDisabled}>Not Available</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text
              style={[
                styles.value,
                networkStatus === 'online' ? styles.online : styles.offline,
              ]}
            >
              {networkStatus === 'online' ? 'Online' : 'Offline'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pending Changes</Text>
            <Text style={styles.value}>{pendingCount}</Text>
          </View>
          {lastSyncedAt && (
            <View style={styles.row}>
              <Text style={styles.label}>Last Synced</Text>
              <Text style={styles.value}>
                {new Date(lastSyncedAt).toLocaleString()}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.syncButton,
              networkStatus === 'offline' && styles.syncButtonDisabled,
            ]}
            onPress={handleSync}
            disabled={networkStatus === 'offline'}
          >
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
