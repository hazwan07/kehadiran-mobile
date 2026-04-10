/**
 * components/ui/Card.tsx
 * 
 * Reusable card component — dark industrial style.
 */

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'bordered';
}

export default function Card({ children, title, style, variant = 'default' }: CardProps) {
  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: '#1e293b',
      borderRadius: 16,
      padding: 16,
    };

    switch (variant) {
      case 'elevated':
        base.shadowColor = '#000';
        base.shadowOffset = { width: 0, height: 4 };
        base.shadowOpacity = 0.3;
        base.shadowRadius = 8;
        base.elevation = 8;
        break;
      case 'bordered':
        base.borderWidth = 1;
        base.borderColor = '#334155';
        break;
    }

    return base;
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {title && (
        <Text
          style={{
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
