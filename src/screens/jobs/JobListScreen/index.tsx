import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedFlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Geolocation from '@react-native-community/geolocation';
import { useJobsStore } from '../../../store/jobsStore';
import { useSyncStore } from '../../../store/syncStore';
import JobCard from '../../../components/jobs/JobCard';
import StatusFilter from '../../../components/jobs/StatusFilter';
import DateRangeFilter from '../../../components/jobs/DateRangeFilter';
import { UI } from '../../../constants';
import type { Job, JobsStackParamList, JobStatus } from '../../../types';
import { styles } from './styles';

type NavigationProp = NativeStackNavigationProp<JobsStackParamList, 'JobList'>;

const STATUS_OPTIONS: JobStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

function isJobOverdue(job: Job): boolean {
  if (job.status === 'completed' || job.status === 'cancelled') {
    return false;
  }
  if (!job.scheduledEnd) {
    return false;
  }
  return new Date(job.scheduledEnd) < new Date();
}

export default function JobListScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const {
    jobs,
    isLoading,
    isLoadingMore,
    error,
    filters,
    hasMore,
    fetchJobs,
    fetchMoreJobs,
    setFilters,
    clearError,
  } = useJobsStore();

  const { networkStatus, pendingCount } = useSyncStore();

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        console.log('Failed to get location:', err.message);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery !== filters.search) {
        setFilters({ search: searchQuery || undefined });
        fetchJobs();
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, filters.search, setFilters, fetchJobs]);

  useEffect(() => {
    const startDateStr = dateRange.startDate
      ? dateRange.startDate.toISOString()
      : undefined;
    const endDateStr = dateRange.endDate
      ? dateRange.endDate.toISOString()
      : undefined;

    if (startDateStr !== filters.startDate || endDateStr !== filters.endDate) {
      setFilters({ startDate: startDateStr, endDate: endDateStr });
      fetchJobs();
    }
  }, [dateRange, filters.startDate, filters.endDate, setFilters, fetchJobs]);

  const handleRefresh = useCallback(() => {
    clearError();
    Geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
    );
    fetchJobs(true);
  }, [fetchJobs, clearError]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      fetchMoreJobs();
    }
  }, [hasMore, isLoadingMore, fetchMoreJobs]);

  const handleStatusFilter = useCallback(
    (status: JobStatus) => {
      const currentStatuses = filters.status || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];

      setFilters({ status: newStatuses.length > 0 ? newStatuses : undefined });
      fetchJobs();
    },
    [filters.status, setFilters, fetchJobs]
  );

  const handleJobPress = useCallback(
    (job: Job) => {
      navigation.navigate('JobDetails', { jobId: job.id });
    },
    [navigation]
  );

  const jobsWithDistance = useMemo(() => {
    if (!userLocation) return jobs.map((job) => ({ job, distance: null }));

    return jobs.map((job) => {
      const distance = null as number | null;
      return { job, distance };
    });
  }, [jobs, userLocation]);

  const renderItem = useCallback(
    ({ item }: { item: { job: Job; distance: number | null } }) => (
      <JobCard
        job={item.job}
        onPress={() => handleJobPress(item.job)}
        isOverdue={isJobOverdue(item.job)}
        distance={item.distance}
      />
    ),
    [handleJobPress]
  );

  const renderFooter = (): React.JSX.Element | null => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={UI.COLORS.primary} />
      </View>
    );
  };

  const renderEmpty = (): React.JSX.Element => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery || filters.status?.length || dateRange.startDate || dateRange.endDate
          ? 'No jobs match your filters'
          : 'No jobs available'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {networkStatus === 'offline' && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Offline Mode {pendingCount > 0 && `(${pendingCount} pending)`}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search jobs..."
          placeholderTextColor={UI.COLORS.disabled}
        />
      </View>

      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <StatusFilter
        options={STATUS_OPTIONS}
        selected={filters.status || []}
        onSelect={handleStatusFilter}
      />

      <View style={styles.listContainer}>
        <AnimatedFlashList
          data={jobsWithDistance}
          renderItem={renderItem}
          keyExtractor={(item) => item.job.id}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={UI.COLORS.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          testID="job-list"
          // Performance optimizations for 60fps scrolling
          drawDistance={250}
        />
      </View>
    </SafeAreaView>
  );
}
