import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store ships no web implementation — its web module is an empty
// object, so every SecureStore.* call throws `undefined is not a function` in
// the browser. The web build is a preview surface rather than a shipping
// target, so fall back to localStorage there instead of failing the session.

const isWeb = Platform.OS === 'web';
const hasWindow = () => typeof window !== 'undefined';

export async function getStoredItem(key: string): Promise<string | null> {
  if (isWeb) {
    if (!hasWindow()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setStoredItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (!hasWindow()) return;
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteStoredItem(key: string): Promise<void> {
  if (isWeb) {
    if (!hasWindow()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // nothing stored to remove
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
