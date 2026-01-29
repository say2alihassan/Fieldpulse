import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik, FormikProps } from 'formik';
import { useJobsStore } from '../../../store/jobsStore';
import { useChecklistStore } from '../../../store/checklistStore';
import ChecklistRenderer from '../../../components/checklist/ChecklistRenderer';
import { generateValidationSchema, getInitialValues } from '../../../utils/checklistValidation';
import { UI } from '../../../constants';
import type { JobsStackParamList } from '../../../types';
import { styles } from './styles';

type RouteProps = RouteProp<JobsStackParamList, 'Checklist'>;
type NavigationProp = NativeStackNavigationProp<JobsStackParamList, 'Checklist'>;

export default function ChecklistScreen(): React.JSX.Element {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId } = route.params;

  const scrollViewRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<Map<string, View>>(new Map());
  const formikRef = useRef<FormikProps<Record<string, unknown>>>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const { currentJob, isLoading: isLoadingJob, fetchJobById } = useJobsStore();
  const {
    responses: storeResponses,
    isSubmitting,
    isSaving,
    error,
    initializeChecklist,
    saveDraft,
    submitChecklist,
    clearError,
    clearChecklist,
  } = useChecklistStore();

  const validationSchema = useMemo(() => {
    if (!currentJob?.checklistTemplate) return null;
    return generateValidationSchema(currentJob.checklistTemplate);
  }, [currentJob?.checklistTemplate]);

  const initialValues = useMemo(() => {
    if (!currentJob?.checklistTemplate) return {};
    return getInitialValues(currentJob.checklistTemplate, currentJob.responses || []);
  }, [currentJob?.checklistTemplate, currentJob?.responses]);

  useEffect(() => {
    if (!currentJob || currentJob.id !== jobId) {
      fetchJobById(jobId);
    }
  }, [jobId, currentJob, fetchJobById]);

  useEffect(() => {
    if (currentJob?.checklistTemplate) {
      initializeChecklist(currentJob.checklistTemplate, currentJob.responses || []);
    }

    return () => {
      clearChecklist();
    };
  }, [currentJob, initializeChecklist, clearChecklist]);

  useFocusEffect(
    useCallback(() => {
      if (formikRef.current && Object.keys(storeResponses).length > 0) {
        for (const [fieldId, value] of Object.entries(storeResponses)) {
          const currentFormikValue = formikRef.current.values[fieldId];
          if (JSON.stringify(currentFormikValue) !== JSON.stringify(value)) {
            formikRef.current.setFieldValue(fieldId, value, true);
          }
        }
      }
    }, [storeResponses])
  );

  const saveDraftWithFormik = useCallback(
    async (_values: Record<string, unknown>) => {
      if (!currentJob?.checklistTemplate) return;

      try {
        await saveDraft(jobId);
      } catch (err) {
        console.error('Failed to save draft:', err);
      }
    },
    [currentJob?.checklistTemplate, jobId, saveDraft]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current === 'active' &&
        (nextAppState === 'inactive' || nextAppState === 'background')
      ) {
        if (formikRef.current?.dirty) {
          saveDraftWithFormik(formikRef.current.values);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [jobId, saveDraftWithFormik]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (formikRef.current?.dirty) {
        saveDraftWithFormik(formikRef.current.values);
      }
    });

    return unsubscribe;
  }, [navigation, jobId, saveDraftWithFormik]);

  const handlePhotoCapture = useCallback(
    (fieldId: string, maxPhotos?: number) => {
      if (formikRef.current?.dirty) {
        saveDraftWithFormik(formikRef.current.values);
      }
      navigation.navigate('PhotoCapture', { jobId, fieldId, maxPhotos });
    },
    [navigation, jobId, saveDraftWithFormik]
  );

  const handleSignatureCapture = useCallback(
    (fieldId: string) => {
      if (formikRef.current?.dirty) {
        saveDraftWithFormik(formikRef.current.values);
      }
      navigation.navigate('SignatureCapture', { jobId, fieldId });
    },
    [navigation, jobId, saveDraftWithFormik]
  );

  const scrollToFirstError = useCallback((errors: Record<string, string>) => {
    if (!currentJob?.checklistTemplate) return;

    const firstErrorFieldId = currentJob.checklistTemplate.fields.find(
      (field) => errors[field.id]
    )?.id;

    if (firstErrorFieldId) {
      const fieldRef = fieldRefs.current.get(firstErrorFieldId);
      if (fieldRef && scrollViewRef.current) {
        fieldRef.measureLayout(
          findNodeHandle(scrollViewRef.current) as number,
          (_x, y) => {
            scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
          },
          () => {
            console.warn('Failed to measure field layout');
          }
        );
      }
    }
  }, [currentJob?.checklistTemplate]);

  const handleSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      if (!currentJob) return;

      Alert.alert(
        'Submit Checklist',
        'Are you sure you want to submit this checklist and complete the job?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: async () => {
              const { updateField } = useChecklistStore.getState();
              for (const [fieldId, value] of Object.entries(values)) {
                updateField(fieldId, value);
              }

              await submitChecklist(jobId, currentJob.version);

              const { error: submitError } = useChecklistStore.getState();
              if (!submitError || submitError === 'Submission queued for sync when online') {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'JobList' }],
                });
              }
            },
          },
        ]
      );
    },
    [currentJob, jobId, submitChecklist, navigation]
  );

  const handleSaveDraft = useCallback(async () => {
    if (formikRef.current) {
      await saveDraftWithFormik(formikRef.current.values);
      Alert.alert('Draft Saved', 'Your checklist progress has been saved.');
    }
  }, [saveDraftWithFormik]);

  const registerFieldRef = useCallback((fieldId: string, ref: View | null) => {
    if (ref) {
      fieldRefs.current.set(fieldId, ref);
    } else {
      fieldRefs.current.delete(fieldId);
    }
  }, []);

  if (isLoadingJob || !currentJob?.checklistTemplate || !validationSchema) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UI.COLORS.primary} />
      </View>
    );
  }

  const canSubmit = currentJob?.status === 'in_progress';
  const template = currentJob.checklistTemplate;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        validateOnBlur={true}
        validateOnChange={false}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          setFieldValue,
          setFieldTouched,
          submitForm,
          validateForm,
          dirty,
        }) => (
          <>
            {isSaving && (
              <View style={styles.savingBanner}>
                <ActivityIndicator size="small" color={UI.COLORS.textLight} />
                <Text style={styles.savingText}>Saving draft...</Text>
              </View>
            )}

            {error && (
              <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.errorDismiss}>Tap to dismiss</Text>
              </TouchableOpacity>
            )}

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              keyboardShouldPersistTaps="handled"
            >
              <ChecklistRenderer
                fields={template.fields}
                values={values}
                errors={errors as Record<string, string>}
                touched={touched as Record<string, boolean>}
                onFieldChange={(fieldId, value) => {
                  setFieldValue(fieldId, value);
                  useChecklistStore.getState().updateField(fieldId, value);
                }}
                onFieldBlur={(fieldId) => {
                  setFieldTouched(fieldId, true);
                  handleBlur(fieldId);
                }}
                onPhotoCapture={handlePhotoCapture}
                onSignatureCapture={handleSignatureCapture}
                registerFieldRef={registerFieldRef}
              />
            </ScrollView>

            <View style={styles.footer}>
              {dirty && (
                <Text style={styles.unsavedText}>Unsaved changes</Text>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.draftButton, isSaving && styles.buttonDisabled]}
                  onPress={handleSaveDraft}
                  disabled={isSaving}
                  testID="save-draft"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={UI.COLORS.primary} />
                  ) : (
                    <Text style={styles.draftButtonText}>Save Draft</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!canSubmit || isSubmitting) && styles.buttonDisabled,
                  ]}
                  onPress={async () => {
                    const validationErrors = await validateForm();

                    for (const field of template.fields) {
                      setFieldTouched(field.id, true, false);
                    }

                    if (Object.keys(validationErrors).length > 0) {
                      scrollToFirstError(validationErrors as Record<string, string>);
                      return;
                    }

                    submitForm();
                  }}
                  disabled={!canSubmit || isSubmitting}
                  testID="submit-checklist"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={UI.COLORS.textLight} />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {canSubmit ? 'Submit & Complete' : 'Start Job First'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </Formik>
    </SafeAreaView>
  );
}
