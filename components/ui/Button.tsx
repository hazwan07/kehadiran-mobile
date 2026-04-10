/**
 * components/ui/Button.tsx
 * 
 * Reusable button component — industrial/utilitarian style.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      ...(fullWidth ? { width: '100%' } : {}),
    };

    // Size
    switch (size) {
      case 'sm':
        base.paddingVertical = 8;
        base.paddingHorizontal = 16;
        break;
      case 'lg':
        base.paddingVertical = 18;
        base.paddingHorizontal = 32;
        break;
      default:
        base.paddingVertical = 14;
        base.paddingHorizontal = 24;
    }

    // Variant
    switch (variant) {
      case 'primary':
        base.backgroundColor = isDisabled ? '#92400e' : '#f59e0b';
        break;
      case 'secondary':
        base.backgroundColor = isDisabled ? '#1e293b' : '#334155';
        break;
      case 'danger':
        base.backgroundColor = isDisabled ? '#7f1d1d' : '#ef4444';
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 2;
        base.borderColor = isDisabled ? '#475569' : '#f59e0b';
        break;
    }

    if (isDisabled) {
      base.opacity = 0.7;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 1,
      textTransform: 'uppercase',
    };

    switch (size) {
      case 'sm':
        base.fontSize = 13;
        break;
      case 'lg':
        base.fontSize = 18;
        break;
      default:
        base.fontSize = 15;
    }

    switch (variant) {
      case 'primary':
        base.color = '#0f172a';
        break;
      case 'outline':
        base.color = isDisabled ? '#475569' : '#f59e0b';
        break;
      default:
        base.color = '#f1f5f9';
    }

    return base;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#0f172a' : '#f1f5f9'}
          style={{ marginRight: 8 }}
        />
      ) : icon ? (
        <>{icon}</>
      ) : null}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
