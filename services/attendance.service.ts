/**
 * services/attendance.service.ts
 * 
 * Attendance submission service.
 * Builds payload and submits to backend with full error handling.
 * 
 * ⚠️ signPayload() MESTI dilaksanakan secara manual oleh developer.
 */

import apiClient, { getApiErrorMessage } from './api.service';
import { generateNonce, signPayload } from '@utils/crypto.utils';
import { getOrCreateDeviceUUID } from './device.service';
import { APP_CONFIG, STORE_KEYS } from '@constants/config';
import * as SecureStore from 'expo-secure-store';
import type {
  AttendancePayload,
  AttendanceRecord,
  VerifiedLocation,
  ApiResponse,
} from '@types/index';

/**
 * Build the full attendance payload from capture data.
 */
export async function buildAttendancePayload(params: {
  employeeId: string;
  location: VerifiedLocation;
  imageBase64: string;
  imageHash: string;
  livenessStepsPassed: string[];
  projectSiteId: string;
  checkType: 'CLOCK_IN' | 'CLOCK_OUT';
}): Promise<AttendancePayload> {
  const deviceUUID = await getOrCreateDeviceUUID();
  const nonce = generateNonce();
  const clientTimestamp = Date.now();

  // Build payload without signature first
  const payloadData = {
    // Identity
    employeeId: params.employeeId,
    deviceUUID,
    appVersion: APP_CONFIG.APP_VERSION,

    // Location
    latitude: params.location.latitude,
    longitude: params.location.longitude,
    gpsAccuracy: params.location.accuracy,
    gpsReadingCount: params.location.readingCount,
    isMockSuspected: params.location.isMockSuspected,

    // Image
    imageBase64: params.imageBase64,
    imageHash: params.imageHash,
    livenessStepsPassed: params.livenessStepsPassed,

    // Security
    nonce,
    clientTimestamp,

    // Context
    projectSiteId: params.projectSiteId,
    checkType: params.checkType,
  };

  // 🔒 HMAC Signature
  // ⚠️ signPayload() will throw until manually implemented
  let hmacSignature = '';
  try {
    const deviceSecret = await SecureStore.getItemAsync(STORE_KEYS.DEVICE_SECRET);
    if (deviceSecret) {
      hmacSignature = await signPayload(payloadData, deviceSecret);
    } else {
      console.warn('[Attendance] Device secret not found — HMAC will be empty');
      hmacSignature = 'NOT_IMPLEMENTED';
    }
  } catch {
    // signPayload throws NOT_IMPLEMENTED for now
    console.warn('[Attendance] HMAC signing not implemented — using placeholder');
    hmacSignature = 'NOT_IMPLEMENTED';
  }

  return {
    ...payloadData,
    hmacSignature,
  };
}

/**
 * Submit attendance record to backend.
 * 
 * Handles all response codes:
 * - 200: Berjaya
 * - 400: Bad request
 * - 403: Device not registered
 * - 409: Duplicate/replay detected
 * - 422: Validation failed
 * - 429: Rate limited
 * - 500: Server error
 */
export async function submitAttendance(
  payload: AttendancePayload
): Promise<{
  success: boolean;
  record?: AttendanceRecord;
  error?: string;
  errorCode?: string;
}> {
  try {
    const response = await apiClient.post<ApiResponse<AttendanceRecord>>(
      '/api/v1/attendance',
      payload
    );

    if (response.data.success && response.data.data) {
      return {
        success: true,
        record: response.data.data,
      };
    }

    return {
      success: false,
      error: response.data.error?.message || 'Ralat tidak diketahui',
      errorCode: response.data.error?.code,
    };
  } catch (error: unknown) {
    const message = getApiErrorMessage(error);
    
    // Extract specific error code from response
    let errorCode = 'UNKNOWN';
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: ApiResponse<unknown> } };
      const status = axiosError.response?.status;
      
      switch (status) {
        case 400:
          errorCode = 'BAD_REQUEST';
          break;
        case 403:
          errorCode = 'DEVICE_NOT_REGISTERED';
          break;
        case 409:
          errorCode = 'DUPLICATE_REQUEST';
          break;
        case 422:
          errorCode = 'VALIDATION_FAILED';
          break;
        case 429:
          errorCode = 'RATE_LIMITED';
          break;
        case 500:
          errorCode = 'SERVER_ERROR';
          break;
      }
    }

    return {
      success: false,
      error: message,
      errorCode,
    };
  }
}

/**
 * Fetch attendance history.
 */
export async function fetchAttendanceHistory(params: {
  startDate?: string;
  endDate?: string;
  projectSiteId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  records?: AttendanceRecord[];
  total?: number;
  error?: string;
}> {
  try {
    const response = await apiClient.get<ApiResponse<{
      records: AttendanceRecord[];
      total: number;
    }>>('/api/v1/attendance/history', {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        projectSiteId: params.projectSiteId,
        page: params.page || 1,
        limit: params.limit || 50,
      },
    });

    if (response.data.success && response.data.data) {
      return {
        success: true,
        records: response.data.data.records,
        total: response.data.data.total,
      };
    }

    return {
      success: false,
      error: response.data.error?.message || 'Gagal mendapatkan rekod',
    };
  } catch (error) {
    return {
      success: false,
      error: getApiErrorMessage(error),
    };
  }
}
