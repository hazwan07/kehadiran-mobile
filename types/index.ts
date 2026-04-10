/**
 * types/index.ts
 * 
 * Semua TypeScript types untuk sistem kehadiran.
 */

// ==================== Employee ====================

export interface Employee {
  employeeId: string;
  name: string;
  icNumber: string; // masked: "XXXXXX-XX-XXXX"
  department: string;
  projectSiteIds: string[];
  photoUrl: string;
  status: 'ACTIVE' | 'INACTIVE';
  position?: string;
}

// ==================== Authentication ====================

export interface LoginRequest {
  employeeId: string;
  pin: string;
}

export interface LoginResponse {
  token: string;
  employee: Employee;
  deviceRegistered: boolean;
}

export interface AuthState {
  employee: Employee | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  deviceUUID: string | null;
  error: string | null;
}

// ==================== Device ====================

export interface DeviceInfo {
  deviceUUID: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}

export interface DeviceIntegrity {
  isRooted: boolean;
  isEmulator: boolean;
  isMockLocationEnabled: boolean;
  integrityScore: number;
  details: string[];
}

// ==================== Location ====================

export interface VerifiedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number; // Unix epoch ms
  readingCount: number;
  isMockSuspected: boolean;
}

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface GeofenceResult {
  inZone: boolean;
  distanceMeters: number;
  status: 'IN' | 'NEAR' | 'OUT';
}

export interface ImpossibleTravelResult {
  isPossible: boolean;
  velocityKmh: number;
}

export type LocationPermissionStatus = 'granted' | 'denied' | 'blocked';

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'GPS_WEAK' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

// ==================== Camera & Liveness ====================

export interface CaptureResult {
  imageUri: string;
  imageBase64: string;
  imageHash: string;
  faceBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  livenessStepsPassed: string[];
  capturedAt: number;
}

export type LivenessStep = 'LOOK_STRAIGHT' | 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT';

export interface LivenessState {
  currentStep: number;
  steps: LivenessStep[];
  completed: boolean;
  passedSteps: string[];
}

// ==================== Attendance ====================

export interface AttendancePayload {
  // Identity
  employeeId: string;
  deviceUUID: string;
  appVersion: string;

  // Location
  latitude: number;
  longitude: number;
  gpsAccuracy: number;
  gpsReadingCount: number;
  isMockSuspected: boolean;

  // Image
  imageBase64: string;
  imageHash: string;
  livenessStepsPassed: string[];

  // Security
  nonce: string;
  clientTimestamp: number;
  hmacSignature: string; // ⚠️ MANUAL IMPLEMENTATION REQUIRED

  // Context
  projectSiteId: string;
  checkType: 'CLOCK_IN' | 'CLOCK_OUT';
}

export interface AttendanceRecord {
  attendanceId: string;
  employeeId: string;
  deviceUUID: string;
  projectSiteId: string;
  checkType: 'CLOCK_IN' | 'CLOCK_OUT';

  // Timestamps
  serverTimestamp: number;
  clientTimestamp: number;

  // Location
  latitude: number;
  longitude: number;
  gpsAccuracy: number;
  distanceFromSite: number;

  // Security
  anomalyScore: number;
  status: 'APPROVED' | 'APPROVED_FLAGGED' | 'REJECTED';
  flagReasons: string[];

  // Media
  imageUrl: string;
  imageHash: string;

  // Review
  reviewedBy: string | null;
  reviewNote: string | null;
  reviewedAt: number | null;
}

// ==================== Project Site ====================

export interface ProjectSite {
  siteId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  activeShifts: ShiftSchedule[];
  adminIds: string[];
}

export interface ShiftSchedule {
  name: string;
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
  daysOfWeek: number[]; // 0=Sunday, 6=Saturday
}

// ==================== Validation ====================

export interface ValidationResult {
  approved: boolean;
  flagged?: boolean;
  reason?: string;
  anomalyScore: number;
  serverTimestamp?: number;
  errors?: string[];
  warnings?: string[];
}

// ==================== Security Events ====================

export interface SecurityEvent {
  eventId?: string;
  employeeId: string;
  deviceUUID: string;
  eventType: SecurityEventType;
  metadata: Record<string, unknown>;
  timestamp: number;
}

export type SecurityEventType =
  | 'ROOT_DETECTED'
  | 'EMULATOR_DETECTED'
  | 'MOCK_GPS'
  | 'TAMPERED_PAYLOAD'
  | 'DEVICE_MISMATCH'
  | 'IMPOSSIBLE_TRAVEL'
  | 'CERTIFICATE_PIN_FAIL'
  | 'INTEGRITY_CHECK_FAIL'
  | 'LOW_INTEGRITY_SCORE';

// ==================== API Response ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ==================== Audit Log ====================

export interface AuditLogEntry {
  logId: string;
  eventType: string;
  actorId: string;
  targetId: string;
  payload: Record<string, unknown>;
  ipAddress: string;
  timestamp: number;
}
