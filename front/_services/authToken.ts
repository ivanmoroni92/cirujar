import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiUser } from './api';

const STORAGE_KEY_TOKEN = 'cirujar_auth_token';
const STORAGE_KEY_USER = 'cirujar_auth_user';

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_TOKEN, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
}

export async function getStoredUser(): Promise<ApiUser | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_USER);
    console.log('[getStoredUser] Retrieved JSON:', json);
    if (!json) {
      console.log('[getStoredUser] No user found in storage');
      return null;
    }
    const user = JSON.parse(json) as ApiUser;
    console.log('[getStoredUser] Parsed user:', user);
    return user;
  } catch (error) {
    console.error('[getStoredUser] Error:', error);
    return null;
  }
}

export async function setStoredUser(user: ApiUser): Promise<void> {
  try {
    console.log('[setStoredUser] Saving user:', user);
    const json = JSON.stringify(user);
    console.log('[setStoredUser] JSON:', json);
    await AsyncStorage.setItem(STORAGE_KEY_USER, json);
    console.log('[setStoredUser] User saved successfully');
  } catch (error) {
    console.error('[setStoredUser] Error:', error);
  }
}

export async function clearStoredUser(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_USER);
}

export async function clearAuth(): Promise<void> {
  await clearStoredToken();
  await clearStoredUser();
}

/** Headers for authenticated `fetch` calls (multipart-safe). */
export async function getBearerAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
