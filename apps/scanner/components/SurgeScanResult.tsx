import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Platform } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useEffect } from "react";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface SurgeScanResultProps {
  position: number;
  surgeId: string;
  claimedAt: string;
  onDismiss: () => void;
}

export function SurgeScanResult({ position, surgeId, claimedAt, onDismiss }: SurgeScanResultProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const screenHeight = Dimensions.get("window").height;
  const claimedTime = new Date(claimedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onDismiss}
      style={[styles.container, { height: screenHeight * 0.5 }]}
    >
      {/* Blur background on iOS */}
      {Platform.OS === 'ios' && (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      )}

      {/* Orange gradient overlay for surge */}
      <LinearGradient
        colors={['rgba(249, 115, 22, 0.95)', 'rgba(234, 88, 12, 0.98)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Specular highlight */}
      <LinearGradient
        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
        style={styles.specularHighlight}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Fire icon */}
        <Text style={styles.fireEmoji}>{"\uD83D\uDD25"}</Text>

        {/* SURGE label */}
        <Text style={styles.surgeLabel}>SURGE PRIORITY</Text>

        {/* Position number */}
        <View style={styles.positionContainer}>
          <Text style={styles.positionLabel}>QUEUE POSITION</Text>
          <Text style={styles.positionNumber}>#{position}</Text>
        </View>

        {/* Claimed time */}
        <View style={styles.infoRow}>
          <FontAwesome name="clock-o" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.infoText}>Claimed at {claimedTime}</Text>
        </View>

        {/* Priority entry badge */}
        <View style={styles.priorityBadge}>
          <FontAwesome name="bolt" size={16} color="#F97316" />
          <Text style={styles.priorityText}>PRIORITY ENTRY</Text>
        </View>

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
  fireEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  surgeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 3,
    marginBottom: 16,
  },
  positionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  positionLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 4,
  },
  positionNumber: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  priorityText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginLeft: 8,
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});
