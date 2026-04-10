/**
 * utils/crypto.utils.ts
 * 
 * Cryptographic utilities untuk payload security.
 * 
 * ⚠️ HIGH-RISK SECURITY CODE
 * Fungsi signPayload() MESTI dilaksanakan secara manual oleh developer.
 * Jangan deploy ke production tanpa implementation ini.
 */

import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

/**
 * Generate unique nonce menggunakan cryptographic random.
 * JANGAN guna Math.random() atau Date.now() sebagai nonce.
 */
export function generateNonce(): string {
  // SECURITY REVIEW REQUIRED
  return Crypto.randomUUID();
}

/**
 * Sign payload menggunakan HMAC-SHA256.
 * 
 * @param payload - Object payload kehadiran
 * @param deviceSecret - Secret key dari secure store
 * @returns HMAC-SHA256 hex string
 */
export async function signPayload(
  payload: object, 
  deviceSecret: string
): Promise<string> {
  const sortedPayload = JSON.stringify(sortObjectKeys(payload as Record<string, unknown>));
  const hmac = CryptoJS.HmacSHA256(sortedPayload, deviceSecret);
  return hmac.toString(CryptoJS.enc.Hex);
}

/**
 * Verify server challenge response.
 * 
 * 🔒 TODO: MANUAL IMPLEMENTATION REQUIRED
 */
export async function verifyServerChallenge(
  challenge: string, 
  secret: string
): Promise<boolean> {
  // SECURITY REVIEW REQUIRED
  void challenge;
  void secret;
  throw new Error('NOT IMPLEMENTED — MANUAL IMPLEMENTATION REQUIRED');
}

/**
 * Hash image data menggunakan SHA-256.
 * Digunakan untuk verify integriti gambar.
 */
export async function hashImageData(imageBase64: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    imageBase64
  );
  return hash;
}

/**
 * Sort object keys recursively untuk consistent JSON stringification.
 * Penting untuk HMAC verification — both client dan server perlu
 * stringify dalam order yang sama.
 */
export function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sorted[key] = sortObjectKeys(value as Record<string, unknown>);
    } else {
      sorted[key] = value;
    }
  }

  return sorted;
}
