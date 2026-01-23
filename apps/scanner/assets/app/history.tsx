import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { getScanHistory, clearHistory, type ScanRecord } from '../../lib/history';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SCAN_RESULTS } from '../../lib/shared';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getScanHistory();
    setHistory(data);
  };

  const handleClear = async () => {
    await clearHistory();
    setHistory([]);
  };

  const renderItem = ({ item }: { item: ScanRecord }) => {
    let color = "text-red-500";
    if (item.result === SCAN_RESULTS.VALID) color = "text-green-500";
    else if (item.result === SCAN_RESULTS.USED) color = "text-yellow-500";

    return (
      <View className="bg-white p-4 border-b border-gray-100 flex-row justify-between items-center">
        <View>
          <Text className={`font-bold ${color}`}>{item.result}</Text>
          <Text className="text-gray-500 text-xs">
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
        <Text className="text-gray-400 font-mono text-xs">
          {item.passId ? `...${item.passId.slice(-6)}` : 'No ID'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-blue-500 font-medium">Close</Text>
        </TouchableOpacity>
        <Text className="font-bold text-lg">Scan History</Text>
        <TouchableOpacity onPress={handleClear} className="p-2">
          <Text className="text-red-500 font-medium">Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="p-8 items-center">
            <Text className="text-gray-400">No scans yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
