/**
 * services/api.service.ts
 * 
 * Axios HTTP client dengan interceptors untuk auth dan error handling.
 * Semua API calls dalam app mesti guna instance ini.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV_CONFIG } from '../constants/config';
import { ApiResponse } from '../types/index';

// Axios instance dengan base config
const apiClient = axios.create({
  baseURL: ENV_CONFIG.API_BASE_URL,
  timeout: 30000, // 30 saat
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Token getter — akan di-set oleh auth store
let getToken: (() => string | null) | null = null;
let onUnauthorized: (() => void) | null = null;

/**
 * Initialize API service dengan callbacks dari auth store.
 * Panggil ini sekali semasa app startup.
 */
export function initApiService(
  tokenGetter: () => string | null,
  unauthorizedCallback: () => void
) {
  getToken = tokenGetter;
  onUnauthorized = unauthorizedCallback;
}

// ==================== Request Interceptor ====================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Tambah Authorization header secara automatik
    if (getToken) {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== Response Interceptor ====================
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response) {
      const { status } = error.response;

      // 401 — Token expired atau invalid → auto logout
      if (status === 401) {
        console.warn('[API] Token expired — triggering logout');
        if (onUnauthorized) {
          onUnauthorized();
        }
      }

      // 429 — Rate limited
      if (status === 429) {
        console.warn('[API] Rate limited — sila cuba selepas beberapa minit');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * Helper untuk extract error message daripada API response.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    
    // Server returned error response
    if (axiosError.response?.data?.error?.message) {
      return axiosError.response.data.error.message;
    }

    // HTTP status-based messages (Bahasa Malaysia)
    switch (axiosError.response?.status) {
      case 400: return 'Permintaan tidak sah';
      case 401: return 'Sesi tamat tempoh. Sila log masuk semula';
      case 403: return 'Akses ditolak. Peranti tidak berdaftar';
      case 404: return 'Sumber tidak dijumpai';
      case 409: return 'Kehadiran sudah direkod';
      case 422: return 'Data tidak sah. Sila semak dan cuba lagi';
      case 429: return 'Terlalu banyak percubaan. Sila cuba selepas beberapa minit';
      case 500: return 'Ralat sistem. Sila cuba selepas beberapa minit';
      default: return 'Ralat tidak diketahui';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ralat tidak diketahui';
}
