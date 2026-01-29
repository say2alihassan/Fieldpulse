// API Configuration
// For physical device testing, replace 'localhost' with your machine's local IP address
// Example: 'http://192.168.0.111:3000/api'
// Find your IP: macOS: `ipconfig getifaddr en0` | Windows: `ipconfig` | Linux: `hostname -I`
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://api.fieldpulse.app/api',
  TIMEOUT: 30000,
  REFRESH_THRESHOLD: 60, // seconds before expiry to refresh token
} as const;

// Uploads Base URL - derived from API BASE_URL (without /api suffix)
// Used for loading photos and other uploaded assets from the server
export const UPLOADS_BASE_URL = API_CONFIG.BASE_URL.replace(/\/api$/, '');

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  LAST_SYNCED_AT: 'last_synced_at',
} as const;

// Sync Configuration
export const SYNC_CONFIG = {
  PULL_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // Base delay in ms for exponential backoff
  BATCH_SIZE: 50,
} as const;

// Photo Configuration
export const PHOTO_CONFIG = {
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 1200,
  QUALITY: 0.8,
  FORMAT: 'jpeg' as const,
} as const;

// Job Status Colors
export const JOB_STATUS_COLORS: Record<string, string> = {
  pending: '#FFA500',
  in_progress: '#2196F3',
  completed: '#4CAF50',
  cancelled: '#9E9E9E',
} as const;

// Job Priority Colors
export const JOB_PRIORITY_COLORS: Record<string, string> = {
  low: '#9E9E9E',
  normal: '#2196F3',
  high: '#FF9800',
  urgent: '#F44336',
} as const;

// UI Constants
export const UI = {
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  BORDER_RADIUS: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  FONT_SIZE: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
  },
  COLORS: {
    primary: '#2196F3',
    primaryDark: '#1976D2',
    secondary: '#FF9800',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    textLight: '#FFFFFF',
    border: '#E0E0E0',
    disabled: '#BDBDBD',
  },
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM d, yyyy',
  DISPLAY_TIME: 'h:mm a',
  DISPLAY_DATETIME: 'MMM d, yyyy h:mm a',
  API_DATE: 'yyyy-MM-dd',
  API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  TIMESTAMP_OVERLAY: 'yyyy-MM-dd HH:mm:ss',
} as const;
