/**
 * components/ui/LoadingOverlay.tsx
 * 
 * Full-screen loading overlay with status message.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({
  visible,
  message = 'Memproses...',
}: LoadingOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(10, 15, 26, 0.85)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            backgroundColor: '#1e293b',
            borderRadius: 20,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#334155',
            minWidth: 200,
          }}
        >
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginBottom: 16 }} />
          <Text
            style={{
              color: '#e2e8f0',
              fontSize: 14,
              fontWeight: '600',
              textAlign: 'center',
              letterSpacing: 0.5,
            }}
          >
            {message}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
