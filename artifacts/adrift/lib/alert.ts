import { Alert, Platform } from 'react-native';

// react-native-web implements Alert as `class Alert { static alert() {} }` —
// a no-op — so anything reported through Alert.alert vanishes in the browser.
// That silently made confirmation dialogs (and the actions behind them)
// unreachable on web. Route web through the window equivalents.

const isWeb = Platform.OS === 'web';
const hasWindow = () => typeof window !== 'undefined';

export function showAlert(title: string, message: string) {
  if (isWeb) {
    if (hasWindow()) window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/**
 * Ask the user to confirm an action. `onConfirm` runs only if they accept.
 * On web this is a blocking window.confirm; on native it is a two-button
 * Alert with the confirm action styled as the default.
 */
export function showConfirm(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void
) {
  if (isWeb) {
    if (hasWindow() && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}
