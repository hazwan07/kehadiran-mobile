/**
 * app/(main)/_layout.tsx
 * 
 * Main group layout — bottom tab navigation.
 * Industrial theme with amber accent.
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MainLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0f1a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 + insets.bottom : 90,
          paddingBottom: Platform.OS === 'ios' ? 28 + insets.bottom : 36,
          paddingTop: 12,
        },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="clock-in"
        options={{
          title: 'Kehadiran',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      borderRadius: 12,
                      padding: 6,
                    }
                  : { padding: 6 }
              }
            >
              <Ionicons
                name={focused ? 'finger-print' : 'finger-print-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Sejarah',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      borderRadius: 12,
                      padding: 6,
                    }
                  : { padding: 6 }
              }
            >
              <Ionicons
                name={focused ? 'time' : 'time-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      borderRadius: 12,
                      padding: 6,
                    }
                  : { padding: 6 }
              }
            >
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
