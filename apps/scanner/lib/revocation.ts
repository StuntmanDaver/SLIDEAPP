import AsyncStorage from "@react-native-async-storage/async-storage";

const REVOCATION_LIST_KEY = "revocation_list";
const REVOCATION_SYNC_KEY = "revocation_last_sync";

export interface RevocationEntry {
  pass_id: string;
  revoked_at: string;
}

export async function getRevocationList(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(REVOCATION_LIST_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function isPassRevoked(passId: string): Promise<boolean> {
  const list = await getRevocationList();
  return list.includes(passId);
}

export async function mergeRevocations(entries: RevocationEntry[]) {
  const list = await getRevocationList();
  const set = new Set(list);
  for (const entry of entries) {
    set.add(entry.pass_id);
  }
  await AsyncStorage.setItem(REVOCATION_LIST_KEY, JSON.stringify(Array.from(set)));
}

export async function getLastRevocationSync(): Promise<string | null> {
  return AsyncStorage.getItem(REVOCATION_SYNC_KEY);
}

export async function setLastRevocationSync(ts: string) {
  await AsyncStorage.setItem(REVOCATION_SYNC_KEY, ts);
}
