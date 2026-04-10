/**
 * app/(main)/profile.tsx
 * 
 * Profile screen — employee info, device info, logout.
 */

import React, { useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth.store';
import { APP_CONFIG } from '../../constants/config';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function ProfileScreen() {
  const { employee, deviceUUID, logout } = useAuthStore();

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Keluar',
      'Adakah anda pasti mahu log keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Log Keluar',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  }, [logout]);

  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: '#0f172a',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={18} color="#f59e0b" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: '#64748b',
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: '#f1f5f9',
            fontSize: 15,
            fontWeight: '600',
            marginTop: 2,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          {/* Avatar */}
          <View
            style={{
              width: 90,
              height: 90,
              borderRadius: 22,
              backgroundColor: '#1e293b',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 3,
              borderColor: '#f59e0b',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#f59e0b', fontSize: 36, fontWeight: '800' }}>
              {employee?.name?.charAt(0) || 'P'}
            </Text>
          </View>

          <Text
            style={{
              color: '#f1f5f9',
              fontSize: 22,
              fontWeight: '800',
              textAlign: 'center',
            }}
          >
            {employee?.name || 'Pekerja'}
          </Text>
          <Text
            style={{
              color: '#64748b',
              fontSize: 13,
              fontWeight: '500',
              marginTop: 4,
            }}
          >
            ID: {employee?.employeeId || '--'}
          </Text>
        </View>

        {/* Employee Info */}
        <Card title="Maklumat Pekerja" variant="bordered" style={{ marginBottom: 16 }}>
          <InfoRow icon="person-outline" label="Nama" value={employee?.name || '--'} />
          <InfoRow icon="card-outline" label="No. IC" value={employee?.icNumber || 'XXXXXX-XX-XXXX'} />
          <InfoRow icon="business-outline" label="Jabatan" value={employee?.department || '--'} />
          <InfoRow
            icon="checkmark-circle-outline"
            label="Status"
            value={employee?.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
          />
        </Card>

        {/* Device Info */}
        <Card title="Maklumat Peranti" variant="bordered" style={{ marginBottom: 16 }}>
          <InfoRow
            icon="phone-portrait-outline"
            label="UUID Peranti"
            value={deviceUUID ? `${deviceUUID.slice(0, 8)}...${deviceUUID.slice(-4)}` : 'Belum dijana'}
          />
          <InfoRow icon="apps-outline" label="Versi Aplikasi" value={APP_CONFIG.APP_VERSION} />
        </Card>

        {/* Security Info */}
        <Card title="Keselamatan" variant="bordered" style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            <Ionicons name="shield-checkmark" size={20} color="#10b981" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#6ee7b7', fontSize: 13, fontWeight: '600' }}>
                Peranti Disahkan
              </Text>
              <Text style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                Data dilindungi dengan penyulitan hujung-ke-hujung
              </Text>
            </View>
          </View>
        </Card>

        {/* Logout Button */}
        <Button
          title="Log Keluar"
          onPress={handleLogout}
          variant="danger"
          icon={<Ionicons name="log-out-outline" size={20} color="#f1f5f9" style={{ marginRight: 8 }} />}
        />

        {/* App Info Footer */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <Text style={{ color: '#334155', fontSize: 11, fontWeight: '500' }}>
            {APP_CONFIG.APP_NAME} v{APP_CONFIG.APP_VERSION}
          </Text>
          <Text style={{ color: '#1e293b', fontSize: 10, marginTop: 4 }}>
            © 2024 Syarikat. Hak Cipta Terpelihara.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
