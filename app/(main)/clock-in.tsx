/**
 * app/(main)/clock-in.tsx
 * 
 * Main clock-in screen — Fasa 1 placeholder.
 * Full implementation akan di Fasa 6.
 * 
 * Design: Industrial/utilitarian
 * Font: System (Rajdhani akan ditambah di Fasa 6)
 * Warna: Slate dark (#1e293b) background, Amber (#f59e0b) accent
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth.store';
import { useAttendanceStore } from '../../stores/attendance.store';
import StatusChip from '../../components/ui/StatusChip';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// Servis, komponen dan types
import AttendanceCamera from '../../components/camera/AttendanceCamera';
import { requestLocationPermission, getVerifiedLocation } from '../../services/location.service';
import { buildAttendancePayload, submitAttendance } from '../../services/attendance.service';
import type { VerifiedLocation } from '../../types';

// Bahasa Malaysia day and month names
const HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
];

export default function ClockInScreen() {
  const { employee } = useAuthStore();
  const { 
    locationStatus, 
    isClockedIn, 
    isSubmitting, 
    lastAttendance,
    setSubmitting, 
    setClockedIn, 
    setLocationStatus,
    setLastAttendance,
  } = useAttendanceStore();
  
  const [showCamera, setShowCamera] = useState(false);
  const [currentLoc, setCurrentLoc] = useState<VerifiedLocation | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingCheckType, setPendingCheckType] = useState<'CLOCK_IN' | 'CLOCK_OUT'>('CLOCK_IN');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Update clock setiap saat
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pulse animation untuk butang
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // Format date in BM
  const formatDate = (date: Date) => {
    const hari = HARI[date.getDay()];
    const tarikh = date.getDate();
    const bulan = BULAN[date.getMonth()];
    const tahun = date.getFullYear();
    return `${hari}, ${tarikh} ${bulan} ${tahun}`;
  };

  // Location status config
  const getLocationChip = () => {
    switch (locationStatus) {
      case 'IN_ZONE':
        return { label: 'Dalam Kawasan', status: 'success' as const, icon: 'location' as const };
      case 'NEAR_ZONE':
        return { label: 'Berhampiran', status: 'warning' as const, icon: 'location-outline' as const };
      case 'OUT_ZONE':
        return { label: 'Luar Kawasan', status: 'danger' as const, icon: 'close-circle' as const };
      case 'ERROR':
        return { label: 'Ralat GPS', status: 'danger' as const, icon: 'alert-circle' as const };
      default:
        return { label: 'Menyemak...', status: 'neutral' as const, icon: 'radio-outline' as const };
    }
  };

  const chipConfig = getLocationChip();

  const handleClockInPress = async () => {
    // Determine check type based on current state
    const checkType = isClockedIn ? 'CLOCK_OUT' : 'CLOCK_IN';

    // Confirmation for Clock Out
    if (isClockedIn) {
      Alert.alert(
        '⏱ Clock Out',
        'Adakah anda pasti mahu merekod waktu keluar?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Ya, Clock Out', style: 'destructive', onPress: () => startAttendanceFlow(checkType) },
        ]
      );
      return;
    }

    startAttendanceFlow(checkType);
  };

  const startAttendanceFlow = async (checkType: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setPendingCheckType(checkType);
    try {
      setSubmitting(true);
      setLocationStatus('CHECKING');
      
      const perm = await requestLocationPermission();
      if (perm !== 'granted') {
        Alert.alert('Ralat', 'Kebenaran GPS diperlukan untuk merekod kehadiran.');
        setLocationStatus('ERROR');
        setSubmitting(false);
        return;
      }

      const result = await getVerifiedLocation();
      if (!result.success) {
        Alert.alert('Ralat GPS', result.error.message);
        setLocationStatus('ERROR');
        setSubmitting(false);
        return;
      }

      // Berjaya dapat GPS
      setCurrentLoc(result.location);
      setLocationStatus('IN_ZONE');
      
      // Buka kamera
      setShowCamera(true);
    } catch (e) {
      console.error(e);
      Alert.alert('Ralat', 'Gagal memproses isyarat lokasi.');
      setLocationStatus('ERROR');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCameraCapture = async (result: { imageUri: string; imageBase64?: string; livenessStepsPassed: string[]; capturedAt: number; }) => {
    setShowCamera(false);
    if (!currentLoc || !employee) return;
    
    setSubmitting(true);
    try {
      const trueBase64 = result.imageBase64 || '';
      const { hashImageData } = require('../../utils/crypto.utils');
      const trueHash = await hashImageData(trueBase64);

      const payload = await buildAttendancePayload({
        employeeId: employee.employeeId,
        location: currentLoc,
        imageBase64: trueBase64,
        imageHash: trueHash,
        livenessStepsPassed: result.livenessStepsPassed,
        projectSiteId: 'S001',
        checkType: pendingCheckType,
      });

      const response = await submitAttendance(payload);
      if (response.success) {
        if (pendingCheckType === 'CLOCK_IN') {
          setClockedIn(true);
          Alert.alert('✅ Tahniah!', 'Kehadiran anda berjaya direkodkan. Selamat bekerja!');
        } else {
          setClockedIn(false);
          Alert.alert('👋 Selamat Pulang', 'Waktu keluar anda telah direkodkan.');
        }
        // Save last attendance timestamp for display
        setLastAttendance({ serverTimestamp: Date.now() } as any);
      } else {
        Alert.alert('Ralat Pelayan', response.error || 'Pelayan gagal mengesahkan rekod.');
      }
    } catch(e) {
      Alert.alert('Ralat Rangkaian', 'Sistem gagal menghubungi server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== HEADER ========== */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#f1f5f9',
                fontSize: 22,
                fontWeight: '800',
                letterSpacing: 0.5,
              }}
            >
              {employee?.name || 'Pekerja'}
            </Text>
            <Text
              style={{
                color: '#64748b',
                fontSize: 13,
                fontWeight: '500',
                marginTop: 2,
              }}
            >
              {employee?.position || employee?.department || 'Pekerja Am'}
            </Text>
          </View>

          {/* Status Chip */}
          <StatusChip
            label={chipConfig.label}
            status={chipConfig.status}
            icon={chipConfig.icon}
            animated={locationStatus === 'CHECKING'}
          />
        </View>

        {/* ========== MAP PLACEHOLDER ========== */}
        <Card variant="bordered" style={{ marginBottom: 16 }}>
          <View
            style={{
              height: 160,
              backgroundColor: '#0a0f1a',
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#1e293b',
              borderStyle: 'dashed',
            }}
          >
            <Ionicons name="map-outline" size={40} color="#334155" />
            <Text
              style={{
                color: '#475569',
                fontSize: 12,
                fontWeight: '500',
                marginTop: 8,
              }}
            >
              Peta lokasi akan dipaparkan di sini
            </Text>
          </View>
        </Card>

        {/* ========== STATUS CARDS (2 columns) ========== */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* GPS Accuracy Card */}
          <Card variant="bordered" style={{ flex: 1 }}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="satellite-outline" size={24} color="#f59e0b" />
              <Text
                style={{
                  color: '#f1f5f9',
                  fontSize: 24,
                  fontWeight: '800',
                  marginTop: 8,
                }}
              >
                --
              </Text>
              <Text
                style={{
                  color: '#64748b',
                  fontSize: 10,
                  fontWeight: '600',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                Ketepatan GPS (m)
              </Text>
            </View>
          </Card>

          {/* Active Site Card */}
          <Card variant="bordered" style={{ flex: 1 }}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="business-outline" size={24} color="#3b82f6" />
              <Text
                style={{
                  color: '#f1f5f9',
                  fontSize: 14,
                  fontWeight: '700',
                  marginTop: 8,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                Tapak Projek A
              </Text>
              <Text
                style={{
                  color: '#64748b',
                  fontSize: 10,
                  fontWeight: '600',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                Tapak Aktif
              </Text>
            </View>
          </Card>
        </View>

        {/* ========== BIG CLOCK ========== */}
        <Card variant="elevated" style={{ marginBottom: 24, alignItems: 'center', paddingVertical: 24 }}>
          <Text
            style={{
              color: '#f59e0b',
              fontSize: 56,
              fontWeight: '800',
              letterSpacing: 4,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatTime(currentTime)}
          </Text>
          <Text
            style={{
              color: '#94a3b8',
              fontSize: 14,
              fontWeight: '500',
              marginTop: 4,
            }}
          >
            {formatDate(currentTime)}
          </Text>

          {/* Clock-in status */}
          {isClockedIn && (
            <View
              style={{
                marginTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#065f46',
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#10b981',
                  marginRight: 8,
                }}
              />
              <Text style={{ color: '#6ee7b7', fontSize: 12, fontWeight: '600' }}>
                SHIFT AKTIF
              </Text>
            </View>
          )}
        </Card>

        {/* ========== CLOCK IN / OUT BUTTON ========== */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Button
            title={isClockedIn ? '⏱ CLOCK OUT' : '🕐 CLOCK IN'}
            loading={isSubmitting}
            onPress={handleClockInPress}
            variant={isClockedIn ? 'danger' : 'primary'}
            size="lg"
            style={{
              height: 64,
              borderRadius: 16,
              ...(Platform.OS === 'ios'
                ? {
                    shadowColor: isClockedIn ? '#ef4444' : '#f59e0b',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                  }
                : { elevation: 8 }),
            }}
            textStyle={{
              fontSize: 20,
              letterSpacing: 2,
            }}
          />
        </Animated.View>

        {/* ========== LAST ATTENDANCE INFO ========== */}
        <Card variant="bordered" style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={18} color="#475569" style={{ marginRight: 8 }} />
            <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '500' }}>
              {lastAttendance?.serverTimestamp
                ? `Kehadiran terakhir: ${new Date(lastAttendance.serverTimestamp).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                : 'Kehadiran terakhir: --'}
            </Text>
          </View>
        </Card>

        {/* ========== HEARTBEAT INDICATOR ========== */}
        {isClockedIn && (
          <View
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#10b981',
                marginRight: 6,
              }}
            />
            <Text style={{ color: '#475569', fontSize: 11, fontWeight: '500' }}>
              Lokasi dipantau setiap 5 minit
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Component Kamera Keselamatan */}
      <AttendanceCamera
        visible={showCamera}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
        locationData={currentLoc!}
        employeeName={employee?.name || ''}
        projectSiteName="Tapak Projek KLCC"
      />
    </SafeAreaView>
  );
}
