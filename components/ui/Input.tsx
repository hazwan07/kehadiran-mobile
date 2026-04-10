/**
 * components/ui/Input.tsx
 * 
 * Styled text input — dark industrial theme.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  icon,
  isPassword = false,
  containerStyle,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? '#ef4444'
    : isFocused
    ? '#f59e0b'
    : '#334155';

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {/* Label */}
      <Text
        style={{
          color: error ? '#fca5a5' : isFocused ? '#f59e0b' : '#94a3b8',
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {label}
      </Text>

      {/* Input Container */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          borderWidth: 2,
          borderColor,
          borderRadius: 12,
          paddingHorizontal: 14,
          height: 52,
        }}
      >
        {/* Left Icon */}
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? '#ef4444' : isFocused ? '#f59e0b' : '#475569'}
            style={{ marginRight: 10 }}
          />
        )}

        {/* Text Input */}
        <TextInput
          style={{
            flex: 1,
            color: '#f1f5f9',
            fontSize: 16,
            fontWeight: '500',
            letterSpacing: 1,
          }}
          placeholderTextColor="#475569"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...textInputProps}
        />

        {/* Password Toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#475569"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Ionicons name="alert-circle" size={14} color="#ef4444" style={{ marginRight: 4 }} />
          <Text style={{ color: '#fca5a5', fontSize: 12, fontWeight: '500' }}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
