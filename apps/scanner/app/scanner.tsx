import { CameraView, useCameraPermissions } from 'expo-camera/next';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { getRevocationList as fetchRevocationList, getScannerPublicKey, redeemPass } from '../lib/api';
import { getDeviceId } from '../lib/device';
import { addScanToHistory } from '../lib/history';
import { router } from 'expo-router';
import { ScanResult } from '../components/ScanResult';
import { SurgeScanResult } from '../components/SurgeScanResult';
import { SCAN_RESULTS } from '@slide/shared';
import * as Haptics from 'expo-haptics';
import {
  cacheScannerPublicKey,
  getCachedScannerPublicKey,
  getPassIdFromToken,
  parseQrToken,
  shouldRefreshPublicKey,
  verifyQrSignature,
} from '../lib/qr';
import {
  getLastRevocationSync,
  isPassRevoked,
  mergeRevocations,
  setLastRevocationSync,
} from '../lib/revocation';

interface SurgeQRData {
  type: 'surge';
  surge_id: string;
  position: number;
  claimed_at: string;
}

// Liquid glass button component for camera overlay
function GlassButton({
  onPress,
  icon,
  iconColor = "white",
  active = false,
  size = 48,
}: {
  onPress: () => void;
  icon: string;
  iconColor?: string;
  active?: boolean;
  size?: number;
}) {
  if (Platform.OS === 'android') {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.glassButton,
          { width: size, height: size },
          active && styles.glassButtonActive,
        ]}
      >
        <FontAwesome name={icon as any} size={size * 0.4} color={active ? "#090908" : iconColor} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={{ width: size, height: size }}>
      <View style={[styles.glassButtonContainer, active && styles.glassButtonActive]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.glassButtonOverlay} />
        <LinearGradient
          colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0)"]}
          style={styles.glassButtonHighlight}
        />
        <FontAwesome name={icon as any} size={size * 0.4} color={active ? "#090908" : iconColor} />
      </View>
    </TouchableOpacity>
  );
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{ result: keyof typeof SCAN_RESULTS; pass_id?: string } | null>(null);
  const [surgeResult, setSurgeResult] = useState<SurgeQRData | null>(null);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const refreshPublicKey = async () => {
      try {
        if (await shouldRefreshPublicKey(24 * 60 * 60 * 1000)) {
          const publicKey = await getScannerPublicKey();
          await cacheScannerPublicKey(publicKey);
        }
      } catch (error) {
        console.error("Failed to refresh scanner public key:", error);
      }
    };

    refreshPublicKey();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const syncRevocations = async () => {
      try {
        const since = await getLastRevocationSync();
        const response = await fetchRevocationList(since || undefined);
        if (response.revoked?.length) {
          await mergeRevocations(response.revoked);
        }
        await setLastRevocationSync(response.synced_at);
      } catch (error) {
        console.error("Failed to sync revocation list:", error);
      }
    };

    syncRevocations();
    interval = setInterval(syncRevocations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-bg p-6">
        <View style={styles.permissionCard}>
          <FontAwesome name="camera" size={48} color="#7D737B" />
          <Text className="text-text-primary text-center text-lg font-semibold mt-4 mb-2">
            Camera Access Required
          </Text>
          <Text className="text-text-secondary text-center mb-6">
            We need camera access to scan QR codes
          </Text>
          <Pressable
            onPress={requestPermission}
            style={styles.permissionButton}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);

    try {
      // Check if this is a surge QR code (JSON format)
      if (data.startsWith('{')) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'surge' && parsed.surge_id && parsed.position) {
            // It's a valid surge QR code
            setSurgeResult(parsed as SurgeQRData);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setProcessing(false);
            return;
          }
        } catch {
          // Not valid JSON, treat as regular QR code
        }
      }

      // Regular pass QR code
      const { token, signature } = parseQrToken(data);
      const cachedPublicKey = await getCachedScannerPublicKey();
      const passIdFromToken = getPassIdFromToken(token);
      const offlineValid = !!signature && !!cachedPublicKey && verifyQrSignature(token, signature, cachedPublicKey);

      if (passIdFromToken && await isPassRevoked(passIdFromToken)) {
        setScanResult({
          result: SCAN_RESULTS.REVOKED,
          pass_id: passIdFromToken
        });
        await addScanToHistory({
          result: SCAN_RESULTS.REVOKED,
          passId: passIdFromToken
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setProcessing(false);
        return;
      }

      if (offlineValid) {
        setScanResult({
          result: SCAN_RESULTS.VALID,
          pass_id: passIdFromToken || undefined
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const deviceId = await getDeviceId();
      const response = await redeemPass(token, deviceId);

      setScanResult({
        result: response.result,
        pass_id: response.pass_id
      });

      await addScanToHistory({
        result: response.result,
        passId: response.pass_id
      });

      if (!offlineValid) {
        if (response.result === SCAN_RESULTS.VALID) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else if (offlineValid && response.result !== SCAN_RESULTS.VALID) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

    } catch (error) {
      console.error(error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      const isNetworkError = errorMessage.includes("Network request failed") || errorMessage.includes("fetch");
      if (isNetworkError) {
        const { token } = parseQrToken(data);
        const passIdFromToken = getPassIdFromToken(token);
        const cachedPublicKey = await getCachedScannerPublicKey();
        const signature = parseQrToken(data).signature;
        const offlineValid = !!signature && !!cachedPublicKey && verifyQrSignature(token, signature, cachedPublicKey);

        if (passIdFromToken && await isPassRevoked(passIdFromToken)) {
          setScanResult({
            result: SCAN_RESULTS.REVOKED,
            pass_id: passIdFromToken
          });
          await addScanToHistory({
            result: SCAN_RESULTS.REVOKED,
            passId: passIdFromToken
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (offlineValid) {
          await addScanToHistory({
            result: SCAN_RESULTS.VALID,
            passId: passIdFromToken || undefined
          });
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setNetworkError(true);
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setScanResult({ result: SCAN_RESULTS.INVALID });
        await addScanToHistory({
          result: SCAN_RESULTS.INVALID
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDismiss = () => {
    setScanResult(null);
    setSurgeResult(null);
    setScanned(false);
    setNetworkError(false);
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <GlassButton
              onPress={() => router.back()}
              icon="arrow-left"
            />

            <View style={styles.rightControls}>
              <GlassButton
                onPress={() => router.push('/history')}
                icon="list"
              />
              <GlassButton
                onPress={toggleTorch}
                icon="bolt"
                active={torchOn}
              />
            </View>
          </View>

          {/* Viewfinder */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinder}>
              {/* Corner accents */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {/* Instruction badge */}
            {Platform.OS === 'ios' ? (
              <BlurView intensity={30} tint="dark" style={styles.instructionBadge}>
                <Text style={styles.instructionText}>Align QR code within frame</Text>
              </BlurView>
            ) : (
              <View style={[styles.instructionBadge, styles.instructionBadgeAndroid]}>
                <Text style={styles.instructionText}>Align QR code within frame</Text>
              </View>
            )}
          </View>

          {/* Processing Overlay */}
          {processing && (
            <View style={styles.processingOverlay}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
              )}
              <View style={styles.processingContent}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.processingText}>Verifying pass...</Text>
              </View>
            </View>
          )}

          {/* Result Overlay */}
          {scanResult && (
            <ScanResult
              result={scanResult.result}
              passId={scanResult.pass_id}
              onDismiss={handleDismiss}
            />
          )}

          {/* Surge Result Overlay */}
          {surgeResult && (
            <SurgeScanResult
              position={surgeResult.position}
              surgeId={surgeResult.surge_id}
              claimedAt={surgeResult.claimed_at}
              onDismiss={handleDismiss}
            />
          )}

          {/* Network Error Overlay */}
          {networkError && (
            <View style={styles.networkErrorOverlay}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
              )}
              <View style={styles.networkErrorContent}>
                <View style={styles.networkErrorIcon}>
                  <FontAwesome name="wifi" size={40} color="#ef4444" />
                </View>
                <Text style={styles.networkErrorTitle}>CONNECTION LOST</Text>
                <Text style={styles.networkErrorMessage}>
                  Cannot verify pass online.{'\n'}Check your network connection.
                </Text>

                <Pressable
                  onPress={handleDismiss}
                  style={styles.networkErrorButton}
                >
                  <Text style={styles.networkErrorButtonText}>Try Again</Text>
                </Pressable>
              </View>
            </View>
          )}
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  glassButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassButtonContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  glassButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glassButtonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  glassButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 24,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 24,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 24,
  },
  instructionBadge: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  instructionBadgeAndroid: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  processingContent: {
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  networkErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    padding: 24,
  },
  networkErrorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  networkErrorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  networkErrorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 2,
  },
  networkErrorMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  networkErrorButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  networkErrorButtonText: {
    color: '#090908',
    fontWeight: '600',
    fontSize: 16,
  },
  permissionCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
  },
  permissionButton: {
    backgroundColor: '#090908',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
