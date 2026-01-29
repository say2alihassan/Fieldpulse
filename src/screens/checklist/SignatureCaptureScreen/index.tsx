import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';
import { useChecklistStore } from '../../../store/checklistStore';
import SignaturePad, { SignaturePadRef } from '../../../components/capture/SignaturePad';
import type { JobsStackParamList } from '../../../types';
import { styles } from './styles';

type RouteProps = RouteProp<JobsStackParamList, 'SignatureCapture'>;

export default function SignatureCaptureScreen(): React.JSX.Element {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { fieldId } = route.params;

  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { updateField } = useChecklistStore();

  useEffect(() => {
    Orientation.lockToLandscape();
    StatusBar.setHidden(true);

    return () => {
      Orientation.lockToPortrait();
      StatusBar.setHidden(false);
    };
  }, []);

  const handleClear = useCallback(() => {
    signaturePadRef.current?.clear();
    setIsEmpty(true);
  }, []);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSave = useCallback(async () => {
    if (!signaturePadRef.current || isEmpty) return;

    setIsSaving(true);

    try {
      const uri = await signaturePadRef.current.exportToPng();

      if (fieldId) {
        updateField(fieldId, {
          uri,
          capturedAt: new Date().toISOString(),
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save signature:', error);
      setIsSaving(false);
    }
  }, [isEmpty, fieldId, updateField, navigation]);

  const handleStrokeEnd = useCallback(() => {
    setIsEmpty(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.landscapeLayout}>
        <View style={styles.sideControls}>
          <TouchableOpacity
            style={styles.sideButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Sign Here</Text>
            <Text style={styles.subtitle}>Use your finger to sign</Text>
          </View>

          <TouchableOpacity
            style={[styles.sideButton, isEmpty && styles.sideButtonDisabled]}
            onPress={handleClear}
            disabled={isEmpty}
          >
            <Text style={[styles.clearText, isEmpty && styles.disabledText]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signatureArea}>
          <View style={styles.signatureContainer}>
            <SignaturePad
              ref={signaturePadRef}
              onStrokeEnd={handleStrokeEnd}
              strokeColor="#000"
              strokeWidth={3}
            />
            <View style={styles.signatureLineOverlay}>
              <View style={styles.line} />
              <Text style={styles.signatureLabel}>Signature</Text>
            </View>
          </View>
        </View>

        <View style={styles.sideControls}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (isEmpty || isSaving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isEmpty || isSaving}
            testID="signature-save"
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
