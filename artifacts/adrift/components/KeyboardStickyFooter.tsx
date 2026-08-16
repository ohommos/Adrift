import React from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

/**
 * A footer that rides just above the keyboard on native, and sits above the
 * tab bar when the keyboard is closed.
 *
 * KeyboardStickyView translates by `keyboardHeight + offset`, where the height
 * is negative while open — so resting above the tab bar means a negative
 * `closed` offset, and `opened: 0` puts the bar flush on the keyboard.
 *
 * On web the browser resizes the viewport itself, so a plain footer with the
 * same resting gap is both correct and simpler.
 */
export function KeyboardStickyFooter({
  children,
  restingOffset,
  style,
}: {
  children: React.ReactNode;
  restingOffset: number;
  style?: ViewStyle;
}) {
  if (Platform.OS === 'web') {
    return <View style={[{ marginBottom: restingOffset }, style]}>{children}</View>;
  }
  return (
    <KeyboardStickyView offset={{ closed: -restingOffset, opened: 0 }} style={style}>
      {children}
    </KeyboardStickyView>
  );
}
