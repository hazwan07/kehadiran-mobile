/**
 * stores/auth.store.ts
 * 
 * Zustand store untuk authentication state.
 * Token disimpan dalam expo-secure-store (encrypted).
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import apiClient, { getApiErrorMessage, initApiService } from '@services/api.service';
import { STORE_KEYS } from '@constants/config';
import type { Employee, LoginResponse, AuthState } from '@types/index';

interface AuthActions {
  /** Login menggunakan Employee ID dan PIN */
  login: (employeeId: string, pin: string) => Promise<void>;
  
  /** Logout dan clear semua state */
  logout: () => Promise<void>;
  
  /** Set device UUID selepas device guard check */
  setDeviceUUID: (uuid: string) => void;
  
  /** Restore saved session semasa app launch */
  restoreSession: () => Promise<void>;
  
  /** Clear error state */
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => {
  // Initialize API service dengan token getter dan logout callback
  initApiService(
    () => get().token,
    () => get().logout()
  );

  return {
    // ==================== State ====================
    employee: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // true semasa restoreSession
    deviceUUID: null,
    error: null,

    // ==================== Actions ====================

    login: async (employeeId: string, pin: string) => {
      set({ isLoading: true, error: null });

      try {
        // API call ke backend
        const response = await apiClient.post<{ success: boolean; data: LoginResponse }>('/api/v1/auth/login', {
          employeeId,
          pin,
        });

        const { token, employee } = response.data.data;

        // Simpan token dalam secure store (encrypted)
        await SecureStore.setItemAsync(STORE_KEYS.AUTH_TOKEN, token);
        
        // Simpan employee data
        await SecureStore.setItemAsync(
          STORE_KEYS.EMPLOYEE_DATA, 
          JSON.stringify(employee)
        );

        set({
          employee,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error: unknown) {
        const message = getApiErrorMessage(error);
        set({
          isLoading: false,
          error: message,
          isAuthenticated: false,
        });
        throw new Error(message);
      }
    },

    logout: async () => {
      try {
        // Clear secure store
        await SecureStore.deleteItemAsync(STORE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(STORE_KEYS.EMPLOYEE_DATA);
      } catch {
        // Abaikan error — clear state tetap jalan
        console.warn('[Auth] Error clearing secure store during logout');
      }

      set({
        employee: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        deviceUUID: null,
        error: null,
      });
    },

    setDeviceUUID: (uuid: string) => {
      set({ deviceUUID: uuid });
    },

    restoreSession: async () => {
      try {
        set({ isLoading: true });

        // Cuba restore token dari secure store
        const token = await SecureStore.getItemAsync(STORE_KEYS.AUTH_TOKEN);
        const employeeData = await SecureStore.getItemAsync(STORE_KEYS.EMPLOYEE_DATA);

        if (token && employeeData) {
          const employee: Employee = JSON.parse(employeeData);
          set({
            token,
            employee,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      } catch {
        // Jika gagal restore, redirect ke login
        console.warn('[Auth] Failed to restore session');
        set({ isLoading: false });
      }
    },

    clearError: () => {
      set({ error: null });
    },
  };
});
