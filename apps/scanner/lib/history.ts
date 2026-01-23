import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCAN_RESULTS } from './shared';

const HISTORY_KEY = 'scan_history';
const MAX_HISTORY = 20;

export interface ScanRecord {
  id: string;
  timestamp: number;
  result: keyof typeof SCAN_RESULTS;
  passId?: string;
}

export async function addScanToHistory(record: Omit<ScanRecord, 'id' | 'timestamp'>) {
  try {
    const history = await getScanHistory();
    const newRecord: ScanRecord = {
      ...record,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    
    const newHistory = [newRecord, ...history].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error('Failed to save history', e);
    return [];
  }
}

export async function getScanHistory(): Promise<ScanRecord[]> {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to read history', e);
    return [];
  }
}

export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
