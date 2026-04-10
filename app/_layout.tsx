/**
 * app/_layout.tsx
 * 
 * Root layout — handles auth state dan routing.
 * Redirect ke login jika tidak authenticated.
 * Redirect ke main jika sudah authenticated.
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/auth.store';
import '../global.css';

export default function RootLayout() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Restore session semasa app launch
  useEffect(() => {
    restoreSession();
  }, []);

  // Auth-based routing guard
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Belum login — redirect ke login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Sudah login — redirect ke main
      router.replace('/(main)/clock-in');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Loading screen semasa restore session
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0f172a',
        }}
      >
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#0f172a" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
