import { Alert, Platform } from 'react-native';

// react-native-web implements Alert as `class Alert { static alert() {} }` —
// a no-op — so anything reported through Alert.alert vanishes in the browser.
// Route web through window.alert so failures stay visible.
export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
