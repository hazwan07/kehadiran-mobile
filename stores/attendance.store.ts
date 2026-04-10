/**
 * stores/attendance.store.ts
 * 
 * Zustand store untuk attendance state dan history.
 */

import { create } from 'zustand';
import type { AttendanceRecord, VerifiedLocation } from '@types/index';

type LocationStatus = 'CHECKING' | 'IN_ZONE' | 'NEAR_ZONE' | 'OUT_ZONE' | 'ERROR';

interface AttendanceState {
  // Current session
  locationStatus: LocationStatus;
  currentLocation: VerifiedLocation | null;
  isSubmitting: boolean;
  lastAttendance: AttendanceRecord | null;
  heartbeatActive: boolean;
  isClockedIn: boolean;

  // History
  attendanceHistory: AttendanceRecord[];
  historyLoading: boolean;

  // Errors
  submitError: string | null;
  locationError: string | null;

  // Debug log
  debugLog: string[];
}

interface AttendanceActions {
  setLocationStatus: (status: LocationStatus) => void;
  setCurrentLocation: (location: VerifiedLocation | null) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setLastAttendance: (record: AttendanceRecord) => void;
  setHeartbeatActive: (active: boolean) => void;
  setClockedIn: (clockedIn: boolean) => void;
  setAttendanceHistory: (records: AttendanceRecord[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  setSubmitError: (error: string | null) => void;
  setLocationError: (error: string | null) => void;
  addDebugLog: (message: string) => void;
  clearDebugLog: () => void;
  reset: () => void;
}

type AttendanceStore = AttendanceState & AttendanceActions;

const INITIAL_STATE: AttendanceState = {
  locationStatus: 'CHECKING',
  currentLocation: null,
  isSubmitting: false,
  lastAttendance: null,
  heartbeatActive: false,
  isClockedIn: false,
  attendanceHistory: [],
  historyLoading: false,
  submitError: null,
  locationError: null,
  debugLog: [],
};

export const useAttendanceStore = create<AttendanceStore>((set) => ({
  ...INITIAL_STATE,

  setLocationStatus: (status) => set({ locationStatus: status }),
  
  setCurrentLocation: (location) => set({ currentLocation: location }),
  
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  setLastAttendance: (record) => set({ lastAttendance: record }),
  
  setHeartbeatActive: (active) => set({ heartbeatActive: active }),
  
  setClockedIn: (clockedIn) => set({ isClockedIn: clockedIn }),
  
  setAttendanceHistory: (records) => set({ attendanceHistory: records }),
  
  setHistoryLoading: (loading) => set({ historyLoading: loading }),
  
  setSubmitError: (error) => set({ submitError: error }),
  
  setLocationError: (error) => set({ locationError: error }),

  addDebugLog: (message) =>
    set((state) => ({
      debugLog: [
        ...state.debugLog.slice(-49), // Keep last 50 entries
        `[${new Date().toISOString()}] ${message}`,
      ],
    })),

  clearDebugLog: () => set({ debugLog: [] }),

  reset: () => set(INITIAL_STATE),
}));
