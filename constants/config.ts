/**
 * constants/config.ts
 * 
 * Semua configuration values dan security thresholds.
 * ⚠️ SEMAK DAN SETUJU DENGAN STAKEHOLDER SEBELUM LAUNCH
 */

// Environment-based config — swap these per environment
export const ENV_CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.kehadiran.example.com',
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
} as const;

// GPS & Geofencing
export const GPS_CONFIG = {
  MAX_GPS_ACCURACY_METERS: 20,        // Tolak jika accuracy > 20m
  GEOFENCE_RADIUS_METERS: 150,        // Dalam kawasan
  GEOFENCE_NEAR_MULTIPLIER: 1.5,      // Near zone = 150 * 1.5 = 225m
  MIN_GPS_READINGS: 3,                // Minimum readings untuk verify
  GPS_READING_COUNT: 5,               // Ambil 5 readings
  GPS_READING_INTERVAL_MS: 2000,      // Interval 2 saat antara readings
  IMPOSSIBLE_TRAVEL_KMH: 250,         // Lebih ini = mustahil
  EARTH_RADIUS_METERS: 6371000,       // Radius bumi untuk Haversine
} as const;

// Security
export const SECURITY_CONFIG = {
  NONCE_TTL_SECONDS: 300,             // 5 minit replay window
  MAX_TIMESTAMP_DRIFT_SECONDS: 300,   // Max perbezaan masa client-server
  RATE_LIMIT_REQUESTS: 10,            // Max requests per window
  RATE_LIMIT_WINDOW_MINUTES: 10,      // Rate limit window
  MAX_FAIL_BEFORE_LOCKOUT: 3,         // Gagal berturutan sebelum lock
  LOCKOUT_DURATION_MINUTES: 15,       // Tempoh lockout
} as const;

// Anomaly Scoring
export const ANOMALY_SCORES = {
  SCORE_HMAC_FAIL: 100,               // Immediate reject
  SCORE_MOCK_GPS: 70,                 // Reject
  SCORE_IMPOSSIBLE_TRAVEL: 60,        // Reject
  SCORE_OUTSIDE_GEOFENCE: 50,         // Reject
  SCORE_DEVICE_MISMATCH: 40,          // Reject
  SCORE_LOW_LIVENESS: 30,             // Borderline
  SCORE_NEAR_BOUNDARY: 20,            // Flag untuk review
  SCORE_LOW_ACCURACY: 15,             // Warning sahaja
  SCORE_LOW_READING_COUNT: 10,        // Warning
  SCORE_BEHAVIORAL_DEVIATION: 15,     // Warning
  AUTO_FLAG_THRESHOLD: 30,            // Score ini ke atas → flag
  AUTO_REJECT_THRESHOLD: 70,          // Score ini ke atas → reject
} as const;

// Session & Heartbeat
export const SESSION_CONFIG = {
  SESSION_TIMEOUT_HOURS: 8,            // 1 shift
  ADMIN_SESSION_TIMEOUT_MINUTES: 30,
  HEARTBEAT_INTERVAL_MS: 300000,       // 5 minit
  LIVENESS_CAPTURE_WINDOW_MS: 3000,    // 3 saat untuk capture selepas liveness pass
  LIVENESS_BLINK_TIMEOUT_MS: 3000,     // 3 saat untuk detect blink
} as const;

// Liveness Detection Thresholds
export const LIVENESS_CONFIG = {
  EYE_OPEN_THRESHOLD: 0.8,            // Mata dianggap terbuka
  EYE_CLOSED_THRESHOLD: 0.3,          // Mata dianggap tertutup (blink)
  SMILE_THRESHOLD: 0.7,               // Senyuman detected
  MIN_FACE_SIZE: 0.15,                // Minimum face size (proportion of screen)
} as const;

// App Metadata
export const APP_CONFIG = {
  APP_NAME: 'Sistem Kehadiran',
  APP_VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@syarikat.com',
  WATERMARK_TEXT: 'SISTEM KEHADIRAN v1.0',
} as const;

// Secure Store Keys
export const STORE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  DEVICE_UUID: 'device_uuid',
  DEVICE_SECRET: 'device_secret',
  EMPLOYEE_DATA: 'employee_data',
  DAILY_CHALLENGE_SEED: 'daily_challenge_seed',
} as const;

// Emulator detection strings
export const EMULATOR_STRINGS = [
  'generic',
  'unknown',
  'google_sdk',
  'emulator',
  'Android SDK built',
  'Genymotion',
  'goldfish',
  'AOSP on IA',
  'sdk_gphone',
] as const;
