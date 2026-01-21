import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Platform } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useEffect } from "react";
import { SCAN_RESULTS } from "@slide/shared";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface ScanResultProps {
  result: keyof typeof SCAN_RESULTS;
  passId?: string;
  onDismiss: () => void;
}

const RESULT_CONFIG = {
  [SCAN_RESULTS.VALID]: {
    gradientColors: ['rgba(34, 197, 94, 0.95)', 'rgba(22, 163, 74, 0.98)'] as const,
    iconName: 'check-circle',
    title: 'VALID',
    message: 'Access Granted',
    iconBgColor: 'rgba(255,255,255,0.2)',
  },
  [SCAN_RESULTS.USED]: {
    gradientColors: ['rgba(234, 179, 8, 0.95)', 'rgba(202, 138, 4, 0.98)'] as const,
    iconName: 'exclamation-circle',
    title: 'ALREADY USED',
    message: 'This pass was already redeemed',
    iconBgColor: 'rgba(255,255,255,0.2)',
  },
  [SCAN_RESULTS.EXPIRED]: {
    gradientColors: ['rgba(249, 115, 22, 0.95)', 'rgba(234, 88, 12, 0.98)'] as const,
    iconName: 'clock-o',
    title: 'EXPIRED',
    message: 'QR code expired - ask to refresh',
    iconBgColor: 'rgba(255,255,255,0.2)',
  },
  [SCAN_RESULTS.REVOKED]: {
    gradientColors: ['rgba(220, 38, 38, 0.95)', 'rgba(185, 28, 28, 0.98)'] as const,
    iconName: 'ban',
    title: 'REVOKED',
    message: 'This pass has been revoked',
    iconBgColor: 'rgba(255,255,255,0.2)',
  },
  [SCAN_RESULTS.INVALID]: {
    gradientColors: ['rgba(239, 68, 68, 0.95)', 'rgba(220, 38, 38, 0.98)'] as const,
    iconName: 'times-circle',
    title: 'INVALID',
    message: 'QR code not recognized',
    iconBgColor: 'rgba(255,255,255,0.2)',
  },
};

export function ScanResult({ result, passId, onDismiss }: ScanResultProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const config = RESULT_CONFIG[result] || RESULT_CONFIG[SCAN_RESULTS.INVALID];
  const screenHeight = Dimensions.get("window").height;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onDismiss}
      style={[styles.container, { height: screenHeight * 0.45 }]}
    >
      {/* Blur background on iOS */}
      {Platform.OS === 'ios' && (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={[...config.gradientColors]}
        style={StyleSheet.absoluteFill}
      />

      {/* Specular highlight */}
      <LinearGradient
        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
        style={styles.specularHighlight}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon with glass circle */}
        <View style={[styles.iconContainer, { backgroundColor: config.iconBgColor }]}>
          <FontAwesome name={config.iconName as any} size={48} color="white" />
        </View>

        {/* Title */}
        <Text style={styles.title}>{config.title}</Text>

        {/* Message */}
        <Text style={styles.message}>{config.message}</Text>

        {/* Pass ID */}
        {passId && (
          <View style={styles.passIdContainer}>
            <Text style={styles.passIdLabel}>Pass ID</Text>
            <Text style={styles.passId}>...{passId.slice(-8)}</Text>
          </View>
        )}

        {/* Tap hint */}
        <Text style={styles.tapHint}>Tap to dismiss</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 8,
  },
  message: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    textAlign: 'center',
  },
  passIdContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  passIdLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  passId: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});
