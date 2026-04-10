/**
 * components/guards/DeviceGuard.tsx
 * 
 * Wrapper component yang menjalankan device integrity check semasa mount.
 * 
 * Behavior:
 * - isEmulator === true → ErrorScreen "Peranti tidak disokong"
 * - isRooted === true → ErrorScreen "Peranti telah diubahsuai"
 * - integrityScore < 50 → WarningScreen + log event
 * - Semua lulus → render children
 * 
 * ⚠️ SECURITY REVIEW REQUIRED
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { checkDeviceIntegrity, reportIntegrityFailure } from '../../services/device.service';
import { APP_CONFIG } from '../../constants/config';
import Button from '../ui/Button';
import type { DeviceIntegrity } from '../../types';

type GuardState = 'CHECKING' | 'PASSED' | 'WARNING' | 'BLOCKED';

interface DeviceGuardProps {
  children: React.ReactNode;
}

export default function DeviceGuard({ children }: DeviceGuardProps) {
  const [state, setState] = useState<GuardState>('CHECKING');
  const [integrity, setIntegrity] = useState<DeviceIntegrity | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');

  useEffect(() => {
    runIntegrityCheck();
  }, []);

  const runIntegrityCheck = async () => {
    setState('CHECKING');

    try {
      const result = await checkDeviceIntegrity();
      setIntegrity(result);

      // SECURITY REVIEW REQUIRED — Keputusan kritikal di bawah
      if (result.isEmulator) {
        setBlockReason('Aplikasi ini tidak boleh digunakan pada emulator atau peranti maya.');
        setState('BLOCKED');
        // Log ke backend — jangan block app untuk ini
        reportIntegrityFailure(result).catch(() => {});
        return;
      }

      if (result.isRooted) {
        setBlockReason('Peranti anda telah diubahsuai (root/jailbreak). Ini melanggar polisi keselamatan syarikat.');
        setState('BLOCKED');
        reportIntegrityFailure(result).catch(() => {});
        return;
      }

      if (result.integrityScore < 50) {
        setState('WARNING');
        reportIntegrityFailure(result).catch(() => {});
        return;
      }

      setState('PASSED');
    } catch (error) {
      // Jika check gagal, biarkan pass tapi log
      console.warn('[DeviceGuard] Integrity check failed:', error);
      setState('PASSED');
    }
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}?subject=Masalah Peranti - Sistem Kehadiran`);
  };

  // ==================== CHECKING STATE ====================
  if (state === 'CHECKING') {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#0f172a',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text
          style={{
            color: '#94a3b8',
            fontSize: 14,
            fontWeight: '500',
            marginTop: 16,
          }}
        >
          Menyemak integriti peranti...
        </Text>
      </SafeAreaView>
    );
  }

  // ==================== BLOCKED STATE ====================
  if (state === 'BLOCKED') {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#0f172a',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
        }}
      >
        {/* Error Icon */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#7f1d1d',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="shield-outline" size={48} color="#fca5a5" />
        </View>

        {/* Title */}
        <Text
          style={{
            color: '#fca5a5',
            fontSize: 22,
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: 12,
            letterSpacing: 0.5,
          }}
        >
          Peranti Tidak Disokong
        </Text>

        {/* Message */}
        <Text
          style={{
            color: '#94a3b8',
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 8,
          }}
        >
          {blockReason}
        </Text>

        {/* Integrity details */}
        {integrity && (
          <View
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 12,
              padding: 16,
              width: '100%',
              marginTop: 16,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                color: '#64748b',
                fontSize: 10,
                fontWeight: '600',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Maklumat Diagnostik
            </Text>
            {integrity.details.map((detail, index) => (
              <Text
                key={index}
                style={{
                  color: '#475569',
                  fontSize: 11,
                  marginBottom: 4,
                  fontFamily: 'monospace',
                }}
              >
                • {detail}
              </Text>
            ))}
            <Text
              style={{
                color: '#475569',
                fontSize: 11,
                marginTop: 8,
                fontFamily: 'monospace',
              }}
            >
              Skor: {integrity.integrityScore}/100
            </Text>
          </View>
        )}

        {/* Contact IT Support */}
        <Button
          title="Hubungi IT Support"
          onPress={handleContactSupport}
          variant="outline"
          icon={<Ionicons name="mail-outline" size={18} color="#f59e0b" style={{ marginRight: 8 }} />}
        />
      </SafeAreaView>
    );
  }

  // ==================== WARNING STATE ====================
  if (state === 'WARNING') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
        {/* Warning Banner at top */}
        <SafeAreaView edges={['top']}>
          <View
            style={{
              backgroundColor: '#78350f',
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="warning" size={20} color="#fcd34d" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fcd34d', fontSize: 12, fontWeight: '700' }}>
                AMARAN KESELAMATAN
              </Text>
              <Text style={{ color: '#fde68a', fontSize: 11, marginTop: 2 }}>
                Skor integriti peranti rendah ({integrity?.integrityScore}/100). 
                Beberapa fungsi mungkin terhad.
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Render children below warning */}
        {children}
      </View>
    );
  }

  // ==================== PASSED STATE ====================
  return <>{children}</>;
}
