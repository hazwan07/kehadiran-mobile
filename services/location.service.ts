/**
 * services/location.service.ts
 * 
 * Location service — GPS verification, geofence checking,
 * heartbeat monitoring, and impossible travel detection.
 * 
 * ⚠️ SECURITY REVIEW REQUIRED pada Haversine formula dan threshold values.
 */

import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import { GPS_CONFIG } from '../constants/config';
import type {
  VerifiedLocation,
  LocationError,
  LocationPermissionStatus,
  Coords,
  GeofenceResult,
  ImpossibleTravelResult,
} from '../types/index';

// ==================== 1. Permission Management ====================

/**
 * Request foreground AND background location permission.
 * 
 * Returns: 'granted' | 'denied' | 'blocked'
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    // Step 1: Request foreground permission dahulu
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      // Check if permanently denied (blocked)
      const { status: checkStatus } = await Location.getForegroundPermissionsAsync();
      if (checkStatus === 'denied') {
        return 'blocked';
      }
      return 'denied';
    }

    // Step 2: Request background permission
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundStatus !== 'granted') {
      // Foreground granted tapi background denied — still usable
      console.warn('[Location] Background permission denied — heartbeat terhad');
    }

    return 'granted';
  } catch (error) {
    console.error('[Location] Permission request failed:', error);
    return 'denied';
  }
}

/**
 * Buka app settings jika permission blocked.
 */
export function openAppSettings(): void {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

// ==================== 2. Verified Location ====================

/**
 * Get a verified GPS location by taking multiple readings.
 * 
 * Proses:
 * a. Ambil 5 readings GPS dengan interval 2 saat
 * b. Filter reading yang accuracy > MAX_GPS_ACCURACY_METERS
 * c. Jika kurang dari 3 readings valid: return error "Isyarat GPS lemah"
 * d. Ambil reading dengan accuracy terbaik (nombor terkecil)
 * e. Semak mock location
 * f. Return VerifiedLocation
 * 
 * ⚠️ JANGAN simplify proses ini — multiple readings penting untuk accuracy.
 */
export async function getVerifiedLocation(): Promise<
  { success: true; location: VerifiedLocation } | 
  { success: false; error: LocationError }
> {
  try {
    // Check permission dahulu
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Kebenaran lokasi tidak diberikan' },
      };
    }

    // Check if location services enabled
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        success: false,
        error: { code: 'GPS_WEAK', message: 'Perkhidmatan lokasi dimatikan. Sila hidupkan GPS.' },
      };
    }

    // ---- Step A: Ambil multiple readings ----
    const readings: Location.LocationObject[] = [];
    const readingCount = GPS_CONFIG.GPS_READING_COUNT; // 5
    const interval = GPS_CONFIG.GPS_READING_INTERVAL_MS; // 2000ms

    for (let i = 0; i < readingCount; i++) {
      try {
        const reading = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          mayShowUserSettingsDialog: true,
        });
        readings.push(reading);
      } catch {
        console.warn(`[Location] Reading ${i + 1} failed`);
      }

      // Wait between readings (except last one)
      if (i < readingCount - 1) {
        await sleep(interval);
      }
    }

    // ---- Step B: Filter by accuracy ----
    const validReadings = readings.filter(
      (r) => r.coords.accuracy !== null && r.coords.accuracy <= GPS_CONFIG.MAX_GPS_ACCURACY_METERS
    );

    // ---- Step C: Minimum valid readings check ----
    if (validReadings.length < GPS_CONFIG.MIN_GPS_READINGS) {
      return {
        success: false,
        error: {
          code: 'GPS_WEAK',
          message: `Isyarat GPS lemah. Hanya ${validReadings.length} dari ${readingCount} bacaan yang sah. Sila cuba di kawasan terbuka.`,
        },
      };
    }

    // ---- Step D: Pick best accuracy (smallest number) ----
    const bestReading = validReadings.reduce((best, current) => {
      const bestAcc = best.coords.accuracy ?? Infinity;
      const currAcc = current.coords.accuracy ?? Infinity;
      return currAcc < bestAcc ? current : best;
    });

    // ---- Step E: Mock location check ----
    // On Android, coords.mocked may be available
    let isMockSuspected = false;
    if (Platform.OS === 'android') {
      // Check if any reading was mocked
      isMockSuspected = readings.some((r) => (r as any).mocked === true);
    }

    // Additional mock detection: check if all readings are exactly the same
    // (real GPS always has slight variance)
    if (validReadings.length >= 3) {
      const allSame = validReadings.every(
        (r) =>
          r.coords.latitude === validReadings[0].coords.latitude &&
          r.coords.longitude === validReadings[0].coords.longitude
      );
      if (allSame) {
        isMockSuspected = true;
      }
    }

    // ---- Step F: Build result ----
    const location: VerifiedLocation = {
      latitude: bestReading.coords.latitude,
      longitude: bestReading.coords.longitude,
      accuracy: bestReading.coords.accuracy ?? 999,
      altitude: bestReading.coords.altitude,
      timestamp: bestReading.timestamp,
      readingCount: validReadings.length,
      isMockSuspected,
    };

    return { success: true, location };
  } catch (error) {
    console.error('[Location] getVerifiedLocation failed:', error);
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'Gagal mendapatkan lokasi. Sila pastikan GPS aktif dan cuba lagi.',
      },
    };
  }
}

// ==================== 3. Geofence Check ====================

/**
 * Check if location is within geofence radius of a site.
 * 
 * ⚠️ WAJIB guna Haversine formula — JANGAN guna Euclidean distance
 * kerana ia tidak tepat untuk koordinat geografi.
 * 
 * Status thresholds:
 * - 'IN':   distance <= radiusM
 * - 'NEAR': distance <= radiusM * 1.5 (flag tapi allow)
 * - 'OUT':  distance > radiusM * 1.5 (reject)
 */
export function checkGeofence(
  location: VerifiedLocation,
  siteCoords: Coords,
  radiusM: number = GPS_CONFIG.GEOFENCE_RADIUS_METERS
): GeofenceResult {
  const distance = haversineDistance(
    { latitude: location.latitude, longitude: location.longitude },
    siteCoords
  );

  const nearThreshold = radiusM * GPS_CONFIG.GEOFENCE_NEAR_MULTIPLIER;

  let status: 'IN' | 'NEAR' | 'OUT';

  if (distance <= radiusM) {
    status = 'IN';
  } else if (distance <= nearThreshold) {
    status = 'NEAR';
  } else {
    status = 'OUT';
  }

  return {
    inZone: status === 'IN',
    distanceMeters: Math.round(distance),
    status,
  };
}

// ==================== 4. Heartbeat ====================

/**
 * Start periodic location monitoring during active shift.
 * 
 * Sample lokasi setiap HEARTBEAT_INTERVAL_MS.
 * Jika pekerja keluar geofence: panggil onLeaveGeofence().
 * 
 * Returns: stopHeartbeat() function
 */
export function startHeartbeat(
  siteCoords: Coords,
  radiusM: number,
  onLocationUpdate: (location: VerifiedLocation, geofence: GeofenceResult) => void,
  onLeaveGeofence: (location: VerifiedLocation, distance: number) => void
): () => void {
  let isRunning = true;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const tick = async () => {
    if (!isRunning) return;

    try {
      const result = await getVerifiedLocation();

      if (result.success) {
        const geofence = checkGeofence(result.location, siteCoords, radiusM);
        
        // Notify location update
        onLocationUpdate(result.location, geofence);

        // Check if left geofence
        if (geofence.status === 'OUT') {
          onLeaveGeofence(result.location, geofence.distanceMeters);
        }
      }
    } catch (error) {
      console.warn('[Heartbeat] Location check failed:', error);
    }

    // Schedule next tick
    if (isRunning) {
      timeoutId = setTimeout(tick, GPS_CONFIG.HEARTBEAT_INTERVAL_MS);
    }
  };

  // Start first tick immediately
  tick();

  // Return stop function
  return () => {
    isRunning = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
}

// ==================== 5. Impossible Travel ====================

/**
 * Detect impossible travel — if velocity exceeds threshold, it's suspicious.
 * 
 * ⚠️ Threshold: kelajuan > 250 km/j = mustahil (lebih laju dari kereta biasa)
 */
export function checkImpossibleTravel(
  prevLocation: { latitude: number; longitude: number; timestamp: number },
  currentLocation: { latitude: number; longitude: number; timestamp: number }
): ImpossibleTravelResult {
  // Calculate distance in meters
  const distanceMeters = haversineDistance(
    { latitude: prevLocation.latitude, longitude: prevLocation.longitude },
    { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
  );

  // Calculate time difference in hours
  const timeDiffMs = Math.abs(currentLocation.timestamp - prevLocation.timestamp);
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

  // Avoid division by zero
  if (timeDiffHours === 0) {
    return { isPossible: distanceMeters < 100, velocityKmh: Infinity };
  }

  // Calculate velocity in km/h
  const velocityKmh = (distanceMeters / 1000) / timeDiffHours;

  return {
    isPossible: velocityKmh <= GPS_CONFIG.IMPOSSIBLE_TRAVEL_KMH,
    velocityKmh: Math.round(velocityKmh * 100) / 100,
  };
}

// ==================== Haversine Formula ====================

/**
 * Calculate great-circle distance between two geographic coordinates.
 * 
 * ⚠️ JANGAN ubah formula ini — ia adalah standard geospatial calculation.
 * 
 * Formula Haversine:
 * R = 6371000 meter (radius bumi)
 * dLat = (lat2-lat1) * π/180
 * dLon = (lon2-lon1) * π/180
 * a = sin(dLat/2)² + cos(lat1*π/180) × cos(lat2*π/180) × sin(dLon/2)²
 * c = 2 × atan2(√a, √(1-a))
 * distance = R × c
 * 
 * @returns Distance in meters
 */
export function haversineDistance(coord1: Coords, coord2: Coords): number {
  const R = GPS_CONFIG.EARTH_RADIUS_METERS; // 6371000 meters

  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(coord1.latitude * Math.PI / 180) *
    Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ==================== Utilities ====================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
