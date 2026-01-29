import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JobListScreen from '../screens/jobs/JobListScreen';
import JobDetailsScreen from '../screens/jobs/JobDetailsScreen';
import ChecklistScreen from '../screens/checklist/ChecklistScreen';
import PhotoCaptureScreen from '../screens/checklist/PhotoCaptureScreen';
import PhotoPreviewScreen from '../screens/checklist/PhotoPreviewScreen';
import SignatureCaptureScreen from '../screens/checklist/SignatureCaptureScreen';
import { UI } from '../constants';
import type { JobsStackParamList } from '../types';

const Stack = createNativeStackNavigator<JobsStackParamList>();

export default function JobsNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: UI.COLORS.surface,
        },
        headerTintColor: UI.COLORS.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="JobList"
        component={JobListScreen}
        options={{ title: 'Jobs' }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ title: 'Job Details' }}
      />
      <Stack.Screen
        name="Checklist"
        component={ChecklistScreen}
        options={{ title: 'Checklist' }}
      />
      <Stack.Screen
        name="PhotoCapture"
        component={PhotoCaptureScreen}
        options={{
          title: 'Take Photo',
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="PhotoPreview"
        component={PhotoPreviewScreen}
        options={{
          title: 'Preview Photo',
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="SignatureCapture"
        component={SignatureCaptureScreen}
        options={{
          title: 'Capture Signature',
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
}
