import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

export default function SentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const textOp = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 400 });
    textOp.value = withDelay(400, withTiming(1, { duration: 500 }));
  }, []);

  const bottleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOp.value }));

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
      <Animated.View style={[styles.bottleWrap, bottleStyle]}>
        <Text style={styles.bottleEmoji}>🍾</Text>
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={[styles.title, { color: colors.primary, fontFamily: 'PirataOne_400Regular' }]}>
          Cast to Sea
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
          Your bottle drifts now. You'll be told when{'\n'}a stranger opens it — but never who.
        </Text>
      </Animated.View>

      <TouchableOpacity
        onPress={() => router.replace('/(tabs)')}
        activeOpacity={0.8}
        style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.buttonText, { color: colors.foreground, fontFamily: 'PirataOne_400Regular' }]}>
          Back to Tides
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingHorizontal: 32 },
  bottleWrap: { marginBottom: 8 },
  bottleEmoji: { fontSize: 80 },
  textWrap: { alignItems: 'center', gap: 12 },
  title: { fontSize: 40, letterSpacing: 1 },
  sub: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  buttonText: { fontSize: 20 },
});
