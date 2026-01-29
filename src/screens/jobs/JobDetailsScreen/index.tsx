import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker } from 'react-native-maps';
import { useJobsStore } from '../../../store/jobsStore';
import StatusBadge from '../../../components/common/StatusBadge';
import { UI, JOB_STATUS_COLORS, JOB_PRIORITY_COLORS, UPLOADS_BASE_URL } from '../../../constants';
import type { JobsStackParamList } from '../../../types';
import { format } from 'date-fns';
import { styles } from './styles';

type RouteProps = RouteProp<JobsStackParamList, 'JobDetails'>;
type NavigationProp = NativeStackNavigationProp<JobsStackParamList, 'JobDetails'>;

export default function JobDetailsScreen(): React.JSX.Element {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId } = route.params;

  const { currentJob, isLoading, error, fetchJobById, startJob, clearCurrentJob } =
    useJobsStore();

  useEffect(() => {
    fetchJobById(jobId);

    return () => {
      clearCurrentJob();
    };
  }, [jobId, fetchJobById, clearCurrentJob]);

  const handleCallCustomer = useCallback(() => {
    if (currentJob?.customer?.phone) {
      Linking.openURL(`tel:${currentJob.customer.phone}`);
    }
  }, [currentJob]);

  const handleOpenMaps = useCallback(() => {
    if (!currentJob?.customer) return;

    const { latitude, longitude, name, addressLine1, city, state, zip } =
      currentJob.customer;

    if (latitude && longitude) {
      const lat = latitude;
      const lng = longitude;
      const label = name || 'Location';
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${lat},${lng}`;
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
      });

      Linking.canOpenURL(url!)
        .then((supported) => {
          if (!supported) {
            const browserUrl = `https://www.google.com/maps/@${lat},${lng}?q=${encodeURIComponent(label)}`;
            return Linking.openURL(browserUrl);
          }
          return Linking.openURL(url!);
        })
        .catch((err) => console.log('Map error:', err));
    } else {
      const address = encodeURIComponent(
        `${addressLine1 || ''} ${city || ''} ${state || ''} ${zip || ''}`
      );
      const url = Platform.select({
        ios: `maps:0,0?q=${address}`,
        android: `geo:0,0?q=${address}`,
      });
      Linking.openURL(url!);
    }
  }, [currentJob]);

  const handleStartJob = useCallback(async () => {
    if (!currentJob) return;

    Alert.alert('Start Job', 'Are you ready to start this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          await startJob(currentJob.id);
        },
      },
    ]);
  }, [currentJob, startJob]);

  const handleOpenChecklist = useCallback(() => {
    navigation.navigate('Checklist', { jobId });
  }, [navigation, jobId]);

  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);

  const photoResponses = useMemo(() => {
    if (!currentJob?.responses || !currentJob?.checklistTemplate) return [];

    const { responses, checklistTemplate } = currentJob;
    const photoFields = checklistTemplate.fields.filter((f) => f.type === 'photo');

    return photoFields
      .map((field) => {
        const response = responses.find((r) => r.fieldId === field.id);
        if (!response || !response.value) return null;

        const photos = Array.isArray(response.value)
          ? response.value
          : [response.value];

        return {
          fieldLabel: field.label,
          photos: photos.filter((p: unknown) => p && typeof p === 'object' && 'uri' in (p as object)),
        };
      })
      .filter((item) => item && item.photos.length > 0);
  }, [currentJob]);

  if (isLoading || !currentJob) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UI.COLORS.primary} />
      </View>
    );
  }

  const { customer, checklistTemplate } = currentJob;
  const hasLocation = customer?.latitude && customer?.longitude;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} testID="job-details">
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.jobNumber}>{currentJob.jobNumber}</Text>
            <StatusBadge
              status={currentJob.status}
              color={JOB_STATUS_COLORS[currentJob.status]}
            />
          </View>
          <Text style={styles.title}>{currentJob.title}</Text>
          {currentJob.description && (
            <Text style={styles.description}>{currentJob.description}</Text>
          )}
          <View style={styles.priorityContainer}>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: JOB_PRIORITY_COLORS[currentJob.priority] },
              ]}
            >
              <Text style={styles.priorityText}>
                {currentJob.priority?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Scheduled:</Text>
            <Text style={styles.scheduleValue}>
              {currentJob.scheduledStart
                ? format(new Date(currentJob.scheduledStart), 'MMM d, yyyy h:mm a')
                : 'Not scheduled'}
            </Text>
          </View>
          {currentJob.actualStart && (
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>Started:</Text>
              <Text style={styles.scheduleValue}>
                {format(new Date(currentJob.actualStart), 'MMM d, yyyy h:mm a')}
              </Text>
            </View>
          )}
        </View>

        {customer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <Text style={styles.customerName}>{customer.name}</Text>

            {customer.phone && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={handleCallCustomer}
              >
                <Text style={styles.contactLabel}>Phone:</Text>
                <Text style={styles.contactValue}>{customer.phone}</Text>
              </TouchableOpacity>
            )}

            {customer.email && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Email:</Text>
                <Text style={styles.contactValue}>{customer.email}</Text>
              </View>
            )}

            {customer.addressLine1 && (
              <TouchableOpacity
                style={styles.addressContainer}
                onPress={handleOpenMaps}
              >
                <Text style={styles.addressText}>
                  {customer.addressLine1}
                  {customer.addressLine2 && `\n${customer.addressLine2}`}
                  {`\n${customer.city || ''}, ${customer.state || ''} ${customer.zip || ''}`}
                </Text>
                <Text style={styles.openMapsText}>Open in Maps</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {hasLocation && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: customer.latitude!,
                longitude: customer.longitude!,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: customer.latitude!,
                  longitude: customer.longitude!,
                }}
                title={customer.name}
              />
            </MapView>
          </View>
        )}

        {checklistTemplate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checklist</Text>
            <Text style={styles.checklistName}>{checklistTemplate.name}</Text>
            <Text style={styles.checklistCount}>
              {checklistTemplate.fields.length} fields
            </Text>
          </View>
        )}

        {photoResponses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            {photoResponses.map((photoGroup, groupIndex) => (
              <View key={`photo-group-${groupIndex}`} style={styles.photoGroup}>
                <Text style={styles.photoGroupLabel}>{photoGroup!.fieldLabel}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosScrollContent}
                >
                  {photoGroup!.photos.map((photo: { uri: string; localPath?: string }, photoIndex: number) => {
                    const imageUri = photo.uri.startsWith('file://')
                      ? photo.uri
                      : photo.uri.startsWith('/uploads')
                        ? `${UPLOADS_BASE_URL}${photo.uri}`
                        : photo.uri;

                    return (
                      <TouchableOpacity
                        key={`photo-${groupIndex}-${photoIndex}`}
                        style={styles.photoThumbnailContainer}
                        onPress={() => setSelectedPhoto(imageUri)}
                      >
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.photoThumbnail}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            activeOpacity={1}
            onPress={() => setSelectedPhoto(null)}
          >
            <Image
              source={{ uri: selectedPhoto || '' }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedPhoto(null)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.actions}>
        {currentJob.status === 'pending' && (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartJob}
            testID="start-job-button"
          >
            <Text style={styles.buttonText}>Start Job</Text>
          </TouchableOpacity>
        )}

        {(currentJob.status === 'pending' ||
          currentJob.status === 'in_progress') &&
          checklistTemplate && (
            <TouchableOpacity
              style={[styles.button, styles.checklistButton]}
              onPress={handleOpenChecklist}
              testID="start-checklist-button"
            >
              <Text style={styles.buttonText}>
                {currentJob.status === 'pending'
                  ? 'View Checklist'
                  : 'Complete Checklist'}
              </Text>
            </TouchableOpacity>
          )}
      </View>
    </SafeAreaView>
  );
}
