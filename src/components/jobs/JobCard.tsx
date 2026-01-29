import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import StatusBadge from '../common/StatusBadge';
import { UI, JOB_STATUS_COLORS, JOB_PRIORITY_COLORS } from '../../constants';
import type { Job } from '../../types';

interface JobCardProps {
  job: Job;
  onPress: () => void;
  isOverdue?: boolean;
  distance?: number | null;
}

const formatDistance = (miles: number): string => {
  if (miles < 0.1) return '< 0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
};

function JobCardComponent({
  job,
  onPress,
  isOverdue = false,
  distance,
}: JobCardProps): React.JSX.Element {
  // Memoize formatted date to avoid recalculating on every render
  const formattedSchedule = useMemo(() => {
    if (!job.scheduledStart) return 'Not scheduled';
    return format(new Date(job.scheduledStart), 'MMM d, h:mm a');
  }, [job.scheduledStart]);

  // Memoize formatted distance
  const formattedDistance = useMemo(() => {
    if (distance === null || distance === undefined) return null;
    return formatDistance(distance);
  }, [distance]);

  return (
    <TouchableOpacity
      style={[styles.container, isOverdue && styles.containerOverdue]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`job-card-${job.id}`}
    >
      {/* Overdue indicator */}
      {isOverdue && (
        <View style={styles.overdueBar} />
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.jobNumber}>{job.jobNumber}</Text>
          {isOverdue && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueText}>OVERDUE</Text>
            </View>
          )}
        </View>
        <StatusBadge
          status={job.status}
          color={JOB_STATUS_COLORS[job.status]}
        />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {job.title}
      </Text>

      {job.description && (
        <Text style={styles.description} numberOfLines={1}>
          {job.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.scheduleContainer}>
            <Text style={styles.scheduleLabel}>Scheduled:</Text>
            <Text
              style={[
                styles.scheduleValue,
                isOverdue && styles.scheduleValueOverdue,
              ]}
            >
              {formattedSchedule}
            </Text>
          </View>

          {/* Distance from current location */}
          {formattedDistance !== null && (
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceIcon}>📍</Text>
              <Text style={styles.distanceText}>{formattedDistance}</Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: JOB_PRIORITY_COLORS[job.priority] },
          ]}
        >
          <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Memoize JobCard to prevent re-renders when props haven't changed
export default memo(JobCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.job.id === nextProps.job.id &&
    prevProps.job.status === nextProps.job.status &&
    prevProps.job.title === nextProps.job.title &&
    prevProps.job.scheduledStart === nextProps.job.scheduledStart &&
    prevProps.job.priority === nextProps.job.priority &&
    prevProps.isOverdue === nextProps.isOverdue &&
    prevProps.distance === nextProps.distance
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.COLORS.surface,
    borderRadius: UI.BORDER_RADIUS.md,
    padding: UI.SPACING.md,
    marginBottom: UI.SPACING.sm,
    borderWidth: 1,
    borderColor: UI.COLORS.border,
    overflow: 'hidden',
  },
  containerOverdue: {
    borderColor: UI.COLORS.error,
    borderWidth: 1,
  },
  overdueBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: UI.COLORS.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI.SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI.SPACING.sm,
  },
  jobNumber: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
    fontWeight: '500',
  },
  overdueBadge: {
    backgroundColor: UI.COLORS.error,
    paddingHorizontal: UI.SPACING.xs,
    paddingVertical: 2,
    borderRadius: UI.BORDER_RADIUS.sm,
  },
  overdueText: {
    fontSize: 9,
    fontWeight: '700',
    color: UI.COLORS.textLight,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.xs,
  },
  description: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.textSecondary,
    marginBottom: UI.SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: UI.SPACING.sm,
    paddingTop: UI.SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: UI.COLORS.border,
  },
  footerLeft: {
    flex: 1,
    gap: UI.SPACING.xs,
  },
  scheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
    marginRight: UI.SPACING.xs,
  },
  scheduleValue: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.text,
    fontWeight: '500',
  },
  scheduleValueOverdue: {
    color: UI.COLORS.error,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  distanceText: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: UI.SPACING.sm,
    paddingVertical: 2,
    borderRadius: UI.BORDER_RADIUS.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: UI.COLORS.textLight,
  },
});
