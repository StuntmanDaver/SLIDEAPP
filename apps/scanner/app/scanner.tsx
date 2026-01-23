import { CameraView, useCameraPermissions } from 'expo-camera/next';
import { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { redeemPass } from '../lib/api';
import { getDeviceId } from '../lib/device';
import { addScanToHistory } from '../lib/history';
import { router } from 'expo-router';
import { ScanResult } from '../components/ScanResult';
import { SCAN_RESULTS } from '../lib/shared';
import * as Haptics from 'expo-haptics';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{ result: keyof typeof SCAN_RESULTS; pass_id?: string } | null>(null);
  const [networkError, setNetworkError] = useState(false);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-bg p-6">
        <Text className="text-text-primary text-center mb-4">We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);
    
    try {
      const deviceId = await getDeviceId();
      const response = await redeemPass(data, deviceId);
      
      setScanResult({
        result: response.result,
        pass_id: response.pass_id
      });

      // Add to history
      await addScanToHistory({
        result: response.result,
        passId: response.pass_id
      });
      
      if (response.result === SCAN_RESULTS.VALID) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Network request failed") || errorMessage.includes("fetch")) {
        setNetworkError(true);
      } else {
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
    setScanned(false);
    setNetworkError(false);
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  return (
    <View className="flex-1 justify-center">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <SafeAreaView className="flex-1 justify-between p-6">
          <View className="flex-row justify-between items-start">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
            >
              <FontAwesome name="arrow-left" size={20} color="white" />
            </TouchableOpacity>

            <View className="flex-row gap-4">
              <TouchableOpacity 
                onPress={() => router.push('/history')}
                className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
              >
                <FontAwesome name="list" size={18} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={toggleTorch}
                className={`w-10 h-10 rounded-full items-center justify-center ${torchOn ? 'bg-white' : 'bg-black/50'}`}
              >
                <FontAwesome name="bolt" size={20} color={torchOn ? "black" : "white"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Viewfinder marker */}
          <View className="flex-1 justify-center items-center">
            <View className="w-64 h-64 border-2 border-white/50 rounded-xl" />
            <Text className="text-white mt-4 font-medium bg-black/30 px-3 py-1 rounded-full overflow-hidden">
              Align QR code
            </Text>
          </View>

          {/* Processing Indicator */}
          {processing && (
            <View className="absolute inset-0 justify-center items-center bg-black/50">
              <ActivityIndicator size="large" color="white" />
              <Text className="text-white mt-4 font-bold">Verifying...</Text>
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

          {/* Network Error Overlay */}
          {networkError && (
            <View className="absolute inset-0 justify-center items-center bg-black/80 z-50 p-6">
              <FontAwesome name="wifi" size={64} color="#ef4444" />
              <Text className="text-white text-3xl font-bold mt-6 mb-2 text-center">NETWORK ERROR</Text>
              <Text className="text-white text-lg text-center mb-8 opacity-80">
                Cannot verify pass.{'\n'}Please check connection or use venue policy.
              </Text>
              
              <TouchableOpacity
                onPress={handleDismiss}
                className="bg-white px-8 py-4 rounded-full"
              >
                <Text className="text-black font-bold text-lg">Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
