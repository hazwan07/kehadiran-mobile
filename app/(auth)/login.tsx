/**
 * app/(auth)/login.tsx
 * 
 * Login screen — Employee ID + 6-digit PIN.
 * Design: Industrial/utilitarian, Slate dark + Amber accent.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth.store';
import { validateLoginForm } from '../../utils/validators';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

export default function LoginScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<{ employeeId?: string; pin?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, error: authError, clearError } = useAuthStore();

  const handleLogin = useCallback(async () => {
    // Clear previous errors
    clearError();
    setErrors({});

    // Validate input
    const validation = validateLoginForm(employeeId, pin);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await login(employeeId, pin);
      // Navigation akan handle oleh root layout selepas auth state berubah
    } catch (err: unknown) {
      // Error sudah di-handle dalam auth store
      // Tapi kita boleh tambah vibration feedback di sini
      const errorMessage = err instanceof Error ? err.message : 'Ralat tidak diketahui';
      console.warn('[Login] Failed:', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [employeeId, pin, login, clearError]);

  const handleContactHR = useCallback(() => {
    Alert.alert(
      'Hubungi HR',
      'Untuk reset PIN, sila hubungi Jabatan Sumber Manusia.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Emel HR',
          onPress: () => Linking.openURL('mailto:hr@syarikat.com?subject=Reset PIN Kehadiran'),
        },
        {
          text: 'Telefon HR',
          onPress: () => Linking.openURL('tel:+60123456789'),
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 28,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header / Branding */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            {/* Icon Container */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: '#1e293b',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
                borderWidth: 2,
                borderColor: '#f59e0b',
              }}
            >
              <Ionicons name="finger-print" size={40} color="#f59e0b" />
            </View>

            {/* App Title */}
            <Text
              style={{
                color: '#f1f5f9',
                fontSize: 28,
                fontWeight: '800',
                letterSpacing: 2,
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              KEHADIRAN
            </Text>
            <Text
              style={{
                color: '#f59e0b',
                fontSize: 13,
                fontWeight: '600',
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginTop: 4,
              }}
            >
              Sistem Kehadiran Pekerja
            </Text>

            {/* Version */}
            <Text
              style={{
                color: '#475569',
                fontSize: 11,
                fontWeight: '500',
                marginTop: 8,
              }}
            >
              v1.0.0
            </Text>
          </View>

          {/* Login Form */}
          <View
            style={{
              backgroundColor: '#141c32',
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: '#1e293b',
            }}
          >
            {/* Auth Error Banner */}
            {authError && (
              <View
                style={{
                  backgroundColor: '#7f1d1d',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="alert-circle" size={18} color="#fca5a5" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fca5a5', fontSize: 13, fontWeight: '500', flex: 1 }}>
                  {authError}
                </Text>
              </View>
            )}

            {/* Employee ID Input */}
            <Input
              label="ID Pekerja"
              placeholder="Contoh: E001"
              icon="person-outline"
              value={employeeId}
              onChangeText={(text) => {
                // Return alphanumeric and uppercase
                setEmployeeId(text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10));
                if (errors.employeeId) setErrors((e) => ({ ...e, employeeId: undefined }));
              }}
              error={errors.employeeId}
              keyboardType="default"
              maxLength={10}
              returnKeyType="next"
              autoCapitalize="characters"
            />

            {/* PIN Input */}
            <Input
              label="PIN (6 Digit)"
              placeholder="• • • • • •"
              icon="lock-closed-outline"
              value={pin}
              onChangeText={(text) => {
                setPin(text.replace(/[^0-9]/g, '').slice(0, 6));
                if (errors.pin) setErrors((e) => ({ ...e, pin: undefined }));
              }}
              error={errors.pin}
              isPassword
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {/* Login Button */}
            <View style={{ marginTop: 8 }}>
              <Button
                title="Log Masuk"
                onPress={handleLogin}
                loading={isSubmitting}
                disabled={!employeeId || !pin}
                size="lg"
              />
            </View>
          </View>

          {/* Help Link */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#475569', fontSize: 12, marginBottom: 4 }}>
              Lupa PIN?
            </Text>
            <Button
              title="Hubungi HR"
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={handleContactHR}
            />
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="shield-checkmark" size={14} color="#334155" style={{ marginRight: 4 }} />
              <Text style={{ color: '#334155', fontSize: 10, fontWeight: '500' }}>
                Data dilindungi dengan penyulitan hujung-ke-hujung
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      <LoadingOverlay visible={isSubmitting} message="Mengesahkan identiti..." />
    </SafeAreaView>
  );
}
