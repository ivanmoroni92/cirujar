import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'cirujar_auth_token';
const STORAGE_USER_ID_KEY = 'cirujar_auth_user_id';

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function getStoredUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_USER_ID_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, token);
}

/** Persists JWT and logged-in user id (for ownership checks in the UI). */
export async function setStoredSession(token: string, userId: string): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEY, token],
    [STORAGE_USER_ID_KEY, userId],
  ]);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEY, STORAGE_USER_ID_KEY]);
}

/** Headers for authenticated `fetch` calls (multipart-safe). */
export async function getBearerAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
