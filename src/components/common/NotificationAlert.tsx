import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationAlertStore, NotificationAlert } from '../../store/notificationAlertStore';
import { navigationRef } from '../../navigation/RootNavigator';
import { UI } from '../../constants';

const AUTO_DISMISS_DURATION = 5000;

const NOTIFICATION_ICONS: Record<NotificationAlert['type'], string> = {
  job_assigned: '📋',
  job_updated: '✏️',
  job_reminder: '⏰',
  job_cancelled: '❌',
  info: 'ℹ️',
};

const NOTIFICATION_COLORS: Record<NotificationAlert['type'], string> = {
  job_assigned: UI.COLORS.primary,
  job_updated: UI.COLORS.info,
  job_reminder: UI.COLORS.warning,
  job_cancelled: UI.COLORS.error,
  info: UI.COLORS.textSecondary,
};

export function NotificationAlertBanner(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const { currentAlert, dismissAlert } = useNotificationAlertStore();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentAlert) {
      // Clear any existing timer
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }

      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_DURATION);
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [currentAlert]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissAlert();
    });
  };

  const handlePress = () => {
    if (!currentAlert) return;

    // Clear timer
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    // Dismiss alert
    handleDismiss();

    // Navigate to job if applicable
    if (currentAlert.jobId && navigationRef.isReady()) {
      navigationRef.navigate('Main', {
        screen: 'Jobs',
        params: {
          screen: 'JobDetails',
          params: { jobId: currentAlert.jobId },
        },
      });
    }
  };

  if (!currentAlert) return null;

  const icon = NOTIFICATION_ICONS[currentAlert.type];
  const accentColor = NOTIFICATION_COLORS[currentAlert.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + UI.SPACING.sm,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable onPress={handlePress} style={styles.pressable}>
        <View style={[styles.content, { borderLeftColor: accentColor }]}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentAlert.title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {currentAlert.body}
            </Text>
            {currentAlert.jobNumber && (
              <Text style={styles.jobNumber}>Tap to view job</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: UI.SPACING.md,
    paddingBottom: UI.SPACING.sm,
  },
  pressable: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.COLORS.surface,
    borderRadius: UI.BORDER_RADIUS.lg,
    padding: UI.SPACING.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UI.COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI.SPACING.md,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
    color: UI.COLORS.text,
    marginBottom: 2,
  },
  body: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.textSecondary,
    lineHeight: 18,
  },
  jobNumber: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  dismissButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: UI.SPACING.sm,
  },
  dismissText: {
    fontSize: 24,
    color: UI.COLORS.textSecondary,
    lineHeight: 24,
  },
});
