/**
 * components/camera/AttendanceCamera.tsx
 * 
 * In-app camera dengan basic liveness detection.
 * Uses expo-camera for capture.
 * 
 * ⚠️ SEMAK MANUAL — ini adalah security logic.
 * Production: Guna react-native-vision-camera + face detector plugin.
 * MVP: Basic camera capture with manual confirmation.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { getDailyLivenessSteps } from '../../services/camera.service';
import Button from '../ui/Button';
import type { VerifiedLocation } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AttendanceCameraProps {
  visible: boolean;
  onCapture: (result: {
    imageUri: string;
    imageBase64?: string;
    livenessStepsPassed: string[];
    capturedAt: number;
  }) => void;
  onClose: () => void;
  locationData: VerifiedLocation;
  employeeName: string;
  projectSiteName: string;
}

// Liveness step instructions in BM
const STEP_INSTRUCTIONS: Record<string, string> = {
  LOOK_STRAIGHT: 'Lihat terus ke kamera',
  BLINK: 'Kedipkan mata anda',
  SMILE: 'Senyum',
  TURN_LEFT: 'Pusing kepala ke kiri',
  TURN_RIGHT: 'Pusing kepala ke kanan',
};

export default function AttendanceCamera({
  visible,
  onCapture,
  onClose,
  employeeName,
  projectSiteName,
}: AttendanceCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing] = useState<CameraType>('front');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [passedSteps, setPassedSteps] = useState<string[]>([]);
  const [canCapture, setCanCapture] = useState(false);
  const [captureTimeout, setCaptureTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Get today's liveness steps
  const livenessSteps = getDailyLivenessSteps();

  const currentStep = livenessSteps[currentStepIndex];

  const handleStepComplete = useCallback(() => {
    const newPassed = [...passedSteps, currentStep];
    setPassedSteps(newPassed);

    if (currentStepIndex < livenessSteps.length - 1) {
      // Move to next step
      setCurrentStepIndex((prev) => prev + 1);
      Animated.timing(progressAnim, {
        toValue: (currentStepIndex + 1) / livenessSteps.length,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // All steps passed — enable capture for 3 seconds
      setCanCapture(true);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Auto-disable after 3 seconds
      const timeout = setTimeout(() => {
        setCanCapture(false);
        resetLiveness();
      }, 3000);
      setCaptureTimeout(timeout);
    }
  }, [currentStep, currentStepIndex, livenessSteps.length, passedSteps, progressAnim]);

  const resetLiveness = () => {
    setCurrentStepIndex(0);
    setPassedSteps([]);
    setCanCapture(false);
    if (captureTimeout) clearTimeout(captureTimeout);
    progressAnim.setValue(0);
  };

  const handleCapture = async () => {
    if (!canCapture || !cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });

      if (photo) {
        // Clear capture timeout
        if (captureTimeout) clearTimeout(captureTimeout);

        onCapture({
          imageUri: photo.uri,
          imageBase64: photo.base64,
          livenessStepsPassed: [...passedSteps, currentStep],
          capturedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('[Camera] Capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  if (!visible) return null;

  // Permission not granted
  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View
          style={{
            flex: 1,
            backgroundColor: '#0f172a',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
          }}
        >
          <Ionicons name="camera-outline" size={64} color="#475569" />
          <Text
            style={{
              color: '#f1f5f9',
              fontSize: 18,
              fontWeight: '700',
              marginTop: 20,
              textAlign: 'center',
            }}
          >
            Kebenaran Kamera Diperlukan
          </Text>
          <Text
            style={{
              color: '#64748b',
              fontSize: 14,
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Kamera diperlukan untuk mengesahkan identiti anda semasa merekod kehadiran.
          </Text>
          <View style={{ marginTop: 24, width: '100%', gap: 12 }}>
            <Button title="Benarkan Kamera" onPress={requestPermission} />
            <Button title="Tutup" variant="outline" onPress={onClose} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Camera Preview */}
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
        >
          {/* Top Controls */}
          <View
            style={{
              paddingTop: 60,
              paddingHorizontal: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <View
              style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                {employeeName} • {projectSiteName}
              </Text>
            </View>
          </View>

          {/* Face Guide Oval */}
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: SCREEN_WIDTH * 0.65,
                height: SCREEN_WIDTH * 0.85,
                borderRadius: SCREEN_WIDTH * 0.325,
                borderWidth: 3,
                borderColor: canCapture ? '#10b981' : '#f59e0b',
                borderStyle: canCapture ? 'solid' : 'dashed',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            />
          </View>

          {/* Bottom Panel */}
          <View
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              paddingBottom: 50,
              paddingTop: 20,
              paddingHorizontal: 24,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            {/* Progress Bar */}
            <View
              style={{
                height: 4,
                backgroundColor: '#1e293b',
                borderRadius: 2,
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  height: '100%',
                  backgroundColor: '#f59e0b',
                  borderRadius: 2,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }}
              />
            </View>

            {/* Step Indicator */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12, gap: 8 }}>
              {livenessSteps.map((step, index) => (
                <View
                  key={step}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor:
                      index < currentStepIndex || (canCapture && index === currentStepIndex)
                        ? '#10b981'
                        : index === currentStepIndex
                        ? '#f59e0b'
                        : '#334155',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {index < currentStepIndex || (canCapture && index === currentStepIndex) ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                      {index + 1}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Instruction Text */}
            <Text
              style={{
                color: canCapture ? '#6ee7b7' : '#f59e0b',
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              {canCapture ? '✓ Sedia! Tekan butang tangkap' : STEP_INSTRUCTIONS[currentStep] || ''}
            </Text>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
              {/* Simulate step (for development — replace with face detection) */}
              {!canCapture && (
                <TouchableOpacity
                  onPress={handleStepComplete}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#334155',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={24} color="#f59e0b" />
                </TouchableOpacity>
              )}

              {/* Capture Button */}
              <TouchableOpacity
                onPress={handleCapture}
                disabled={!canCapture || isCapturing}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: canCapture ? '#10b981' : '#475569',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 4,
                  borderColor: canCapture ? '#6ee7b7' : '#334155',
                  opacity: canCapture ? 1 : 0.5,
                }}
              >
                <Ionicons
                  name="camera"
                  size={32}
                  color={canCapture ? '#fff' : '#64748b'}
                />
              </TouchableOpacity>
            </View>

            {/* Capture window timer */}
            {canCapture && (
              <Text
                style={{
                  color: '#64748b',
                  fontSize: 11,
                  textAlign: 'center',
                  marginTop: 12,
                }}
              >
                Tangkap dalam 3 saat...
              </Text>
            )}
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}
