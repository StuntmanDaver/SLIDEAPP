import { View, Text, FlatList, Pressable, StyleSheet, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { getScanHistory, clearHistory, type ScanRecord } from '../lib/history';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SCAN_RESULTS } from '@slide/shared';
import { GlassCard } from '../components/glass';
import { BlurView } from 'expo-blur';

const RESULT_CONFIG = {
  [SCAN_RESULTS.VALID]: {
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    icon: 'check-circle',
    label: 'VALID',
  },
  [SCAN_RESULTS.USED]: {
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    icon: 'exclamation-circle',
    label: 'ALREADY USED',
  },
  [SCAN_RESULTS.EXPIRED]: {
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    icon: 'clock-o',
    label: 'EXPIRED',
  },
  [SCAN_RESULTS.REVOKED]: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    icon: 'ban',
    label: 'REVOKED',
  },
  [SCAN_RESULTS.INVALID]: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    icon: 'times-circle',
    label: 'INVALID',
  },
};

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

  const renderItem = ({ item, index }: { item: ScanRecord; index: number }) => {
    const config = RESULT_CONFIG[item.result] || RESULT_CONFIG[SCAN_RESULTS.INVALID];

    return (
      <View style={[styles.itemContainer, index === 0 && styles.firstItem]}>
        <View style={[styles.resultBadge, { backgroundColor: config.bgColor }]}>
          <FontAwesome name={config.icon as any} size={16} color={config.color} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.resultLabel, { color: config.color }]}>
            {config.label}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <Text style={styles.passId}>
          {item.passId ? `...${item.passId.slice(-6)}` : '—'}
        </Text>
      </View>
    );
  };

  const Header = () => (
    <View style={styles.header}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(225, 226, 221, 0.95)' }]} />
      )}
      <View style={styles.headerContent}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <FontAwesome name="chevron-down" size={20} color="#090908" />
        </Pressable>
        <Text style={styles.headerTitle}>Scan History</Text>
        <Pressable onPress={handleClear} style={styles.headerButton}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GlassCard intensity="ultraThin" floating>
              <View style={styles.emptyContent}>
                <FontAwesome name="history" size={32} color="#7D737B" />
                <Text style={styles.emptyText}>No scans yet</Text>
                <Text style={styles.emptySubtext}>
                  Scanned passes will appear here
                </Text>
              </View>
            </GlassCard>
          </View>
        }
        ListHeaderComponent={
          history.length > 0 ? (
            <GlassCard intensity="ultraThin" floating style={styles.listCard}>
              <View />
            </GlassCard>
          ) : null
        }
        ListFooterComponent={history.length > 0 ? <View style={{ height: 100 }} /> : null}
      />

      {history.length > 0 && (
        <View style={styles.historyCardWrapper}>
          <GlassCard intensity="ultraThin" floating>
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          </GlassCard>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1E2DD',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#090908',
  },
  clearText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
    textAlign: 'right',
  },
  listContent: {
    padding: 20,
  },
  historyCardWrapper: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    bottom: 40,
  },
  listCard: {
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  firstItem: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  resultBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 12,
    color: '#7D737B',
    marginTop: 2,
  },
  passId: {
    fontSize: 12,
    color: '#7D737B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#090908',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7D737B',
    marginTop: 4,
  },
});
