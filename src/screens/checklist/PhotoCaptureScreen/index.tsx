import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Geolocation from '@react-native-community/geolocation';
import { useChecklistStore } from '../../../store/checklistStore';
import { UI } from '../../../constants';
import type { JobsStackParamList } from '../../../types';
import { styles } from './styles';

interface PhotoItem {
  uri: string;
  localPath: string;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string;
  width: number;
  height: number;
}

type RouteProps = RouteProp<JobsStackParamList, 'PhotoCapture'>;
type NavigationProp = NativeStackNavigationProp<JobsStackParamList, 'PhotoCapture'>;

export default function PhotoCaptureScreen(): React.JSX.Element {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, fieldId, maxPhotos = 5 } = route.params;

  const cameraRef = useRef<Camera>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const { responses } = useChecklistStore();
  const existingPhotos = (responses[fieldId] as PhotoItem[] | null) || [];

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    if (existingPhotos.length >= maxPhotos) {
      Alert.alert(
        'Maximum Photos Reached',
        `You can only capture up to ${maxPhotos} photos for this field.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePhoto();

      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const position = await new Promise<{ coords: { latitude: number; longitude: number } }>(
          (resolve, reject) => {
            Geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
            });
          }
        );
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        // GPS not available
      }

      navigation.navigate('PhotoPreview', {
        jobId,
        fieldId,
        photoUri: `file://${photo.path}`,
        latitude,
        longitude,
        maxPhotos,
      });

      setIsCapturing(false);
    } catch (error) {
      console.error('Photo capture failed:', error);
      setIsCapturing(false);
    }
  }, [isCapturing, fieldId, jobId, navigation, existingPhotos.length, maxPhotos]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required to take photos
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>No camera device found</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      <SafeAreaView style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.photoCountText}>
            {existingPhotos.length} / {maxPhotos} photos
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapture}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color={UI.COLORS.text} />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>
        <Text style={styles.captureHint}>Tap to capture</Text>
      </View>
    </View>
  );
}
