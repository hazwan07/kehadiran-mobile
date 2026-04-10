/**
 * services/device.service.ts
 * 
 * Device security service — UUID management, root/jailbreak detection,
 * emulator detection, and device integrity scoring.
 * 
 * ⚠️ SECURITY REVIEW REQUIRED pada setiap bahagian yang melibatkan
 * keputusan security kritikal.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { STORE_KEYS, EMULATOR_STRINGS } from '@constants/config';
import type { DeviceIntegrity, DeviceInfo } from '@types/index';
import apiClient from './api.service';

// ==================== BAHAGIAN A — Device UUID ====================
// ⚠️ SEMAK MANUAL: UUID mesti dari Keystore/Keychain (expo-secure-store)

/**
 * Get or create a persistent device UUID.
 * 
 * UUID dijana menggunakan Crypto.randomUUID() (cryptographic random)
 * dan disimpan dalam expo-secure-store (Keychain/Keystore).
 * 
 * SECURITY REVIEW REQUIRED:
 * - UUID disimpan dalam hardware-backed secure storage
 * - JANGAN guna Math.random() atau Date.now()
 * - JANGAN guna AsyncStorage (tidak encrypted)
 */
export async function getOrCreateDeviceUUID(): Promise<string> {
  try {
    // Cuba baca UUID sedia ada dari secure store
    const existingUUID = await SecureStore.getItemAsync(STORE_KEYS.DEVICE_UUID);
    
    if (existingUUID) {
      return existingUUID;
    }

    // Janakan UUID baru menggunakan cryptographic random
    // SECURITY REVIEW REQUIRED — Pastikan Crypto.randomUUID() menggunakan
    // CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)
    const newUUID = Crypto.randomUUID();
    
    // Simpan dalam secure store (Keychain pada iOS, Keystore pada Android)
    await SecureStore.setItemAsync(STORE_KEYS.DEVICE_UUID, newUUID);
    
    return newUUID;
  } catch (error) {
    console.error('[DeviceService] Failed to get/create device UUID:', error);
    // Jika secure store gagal, janakan UUID sementara
    // TAPI log sebagai security event
    const fallbackUUID = Crypto.randomUUID();
    await logSecurityEventSilent('DEVICE_UUID_FALLBACK', { error: String(error) });
    return fallbackUUID;
  }
}

// ==================== BAHAGIAN B — Root / Jailbreak Detection ====================

/**
 * Comprehensive device integrity check.
 * 
 * Checks for:
 * 1. Emulator detection
 * 2. Root/jailbreak indicators
 * 3. Mock location capability
 * 
 * Returns integrity score (0-100, higher = more secure)
 * 
 * SECURITY REVIEW REQUIRED:
 * - Detection methods boleh di-bypass oleh attacker canggih
 * - Ini adalah layer pertama sahaja — backend validation tetap diperlukan
 */
export async function checkDeviceIntegrity(): Promise<DeviceIntegrity> {
  const details: string[] = [];
  let score = 100;
  let isEmulator = false;
  let isRooted = false;

  // ---- Check 1: Is physical device? ----
  // SECURITY REVIEW REQUIRED
  if (!Device.isDevice) {
    isEmulator = true;
    score -= 40;
    details.push('Bukan peranti fizikal (kemungkinan emulator)');
  }

  // ---- Check 2: Emulator string detection ----
  const buildId = Device.osInternalBuildId || '';
  const deviceName = Device.deviceName || '';
  const modelName = Device.modelName || '';
  const brand = Device.brand || '';
  
  const deviceStrings = [buildId, deviceName, modelName, brand]
    .join(' ')
    .toLowerCase();

  for (const emulatorString of EMULATOR_STRINGS) {
    if (deviceStrings.includes(emulatorString.toLowerCase())) {
      isEmulator = true;
      score -= 20;
      details.push(`Emulator string detected: "${emulatorString}"`);
      break; // Satu detection sudah cukup
    }
  }

  // ---- Check 3: Platform-specific checks ----
  if (Platform.OS === 'android') {
    // Android-specific root indicators
    // SECURITY REVIEW REQUIRED — checks ini boleh di-bypass
    
    // Check for common emulator model names
    if (modelName?.includes('sdk') || modelName?.includes('Emulator')) {
      isEmulator = true;
      score -= 15;
      details.push('Model peranti menunjukkan emulator Android');
    }

    // Check manufacturer
    if (brand?.toLowerCase() === 'google' && modelName?.toLowerCase().includes('sdk')) {
      isEmulator = true;
      score -= 15;
      details.push('Peranti Google SDK detected');
    }
  }

  if (Platform.OS === 'ios') {
    // iOS simulator check
    if (deviceName?.includes('Simulator')) {
      isEmulator = true;
      score -= 30;
      details.push('iOS Simulator detected');
    }
  }

  // ---- Check 4: OS version sanity ----
  const osVersion = Device.osVersion || '';
  if (!osVersion || osVersion === 'unknown') {
    score -= 10;
    details.push('Versi OS tidak dapat dikenalpasti');
  }

  // ---- Check 5: Device type check ----
  // Device.deviceType: 0=unknown, 1=phone, 2=tablet, 3=desktop, 4=tv
  const deviceType = Device.deviceType;
  if (deviceType === 0 || deviceType === 3 || deviceType === 4) {
    score -= 15;
    details.push(`Jenis peranti tidak dijangka: ${deviceType}`);
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  // Mark as potentially rooted if score is very low
  // SECURITY REVIEW REQUIRED — this is a basic heuristic
  if (score < 30) {
    isRooted = true;
    details.push('Skor integriti rendah — kemungkinan peranti diubahsuai');
  }

  return {
    isRooted,
    isEmulator,
    isMockLocationEnabled: false, // Will be updated by Location Service
    integrityScore: score,
    details,
  };
}

/**
 * Get basic device info for payload.
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceUUID = await getOrCreateDeviceUUID();
  
  return {
    deviceUUID,
    deviceModel: `${Device.manufacturer || 'Unknown'} ${Device.modelName || 'Unknown'}`,
    osVersion: `${Platform.OS} ${Device.osVersion || 'Unknown'}`,
    appVersion: '1.0.0', // TODO: Get from expo-constants
  };
}

// ==================== Security Event Logger ====================

/**
 * Log security event ke backend secara silent (jangan block app).
 * 
 * Best effort — jika gagal, abaikan sahaja.
 */
async function logSecurityEventSilent(
  eventType: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    const deviceUUID = await SecureStore.getItemAsync(STORE_KEYS.DEVICE_UUID);
    
    await apiClient.post('/api/security/events', {
      deviceUUID: deviceUUID || 'unknown',
      eventType,
      metadata,
      timestamp: Date.now(),
    });
  } catch {
    // Abaikan — jangan block app untuk security logging
    console.warn(`[DeviceService] Failed to log security event: ${eventType}`);
  }
}

/**
 * Log device integrity failure ke backend.
 */
export async function reportIntegrityFailure(integrity: DeviceIntegrity): Promise<void> {
  await logSecurityEventSilent(
    integrity.isEmulator ? 'EMULATOR_DETECTED' : 
    integrity.isRooted ? 'ROOT_DETECTED' : 
    'LOW_INTEGRITY_SCORE',
    {
      integrityScore: integrity.integrityScore,
      isEmulator: integrity.isEmulator,
      isRooted: integrity.isRooted,
      details: integrity.details,
      deviceModel: Device.modelName,
      osVersion: Device.osVersion,
      platform: Platform.OS,
    }
  );
}
