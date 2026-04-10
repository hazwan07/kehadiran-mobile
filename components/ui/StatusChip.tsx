/**
 * components/ui/StatusChip.tsx
 * 
 * Status indicator chip — shows location/attendance status.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ChipStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusChipProps {
  label: string;
  status: ChipStatus;
  icon?: keyof typeof Ionicons.glyphMap;
  animated?: boolean;
  size?: 'sm' | 'md';
}

const STATUS_COLORS: Record<ChipStatus, { bg: string; text: string; icon: string }> = {
  success: { bg: '#065f46', text: '#6ee7b7', icon: '#10b981' },
  warning: { bg: '#78350f', text: '#fcd34d', icon: '#f59e0b' },
  danger: { bg: '#7f1d1d', text: '#fca5a5', icon: '#ef4444' },
  info: { bg: '#1e3a5f', text: '#93c5fd', icon: '#3b82f6' },
  neutral: { bg: '#334155', text: '#94a3b8', icon: '#64748b' },
};

export default function StatusChip({
  label,
  status,
  icon,
  animated = false,
  size = 'md',
}: StatusChipProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const colors = STATUS_COLORS[status];

  useEffect(() => {
    if (animated) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [animated, pulseAnim]);

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 20,
    paddingHorizontal: size === 'sm' ? 10 : 14,
    paddingVertical: size === 'sm' ? 4 : 6,
    alignSelf: 'flex-start',
  };

  return (
    <Animated.View style={[containerStyle, animated ? { opacity: pulseAnim } : {}]}>
      {icon && (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 12 : 16}
          color={colors.icon}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        style={{
          color: colors.text,
          fontSize: size === 'sm' ? 11 : 13,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
