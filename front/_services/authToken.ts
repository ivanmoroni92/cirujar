import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'cirujar_auth_token';

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Headers for authenticated `fetch` calls (multipart-safe). */
export async function getBearerAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
