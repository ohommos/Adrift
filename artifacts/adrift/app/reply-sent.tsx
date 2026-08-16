import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function ReplySentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: topPad,
          paddingBottom: bottomPad,
        },
      ]}
    >
      <Text style={styles.wave}>🌊</Text>
      <Text style={[styles.title, { color: colors.seaglass, fontFamily: 'PirataOne_400Regular' }]}>
        Reply Cast
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
        Your reply is drifting back{'\n'}to the one who wrote it.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace('/(tabs)/haul')}
        activeOpacity={0.8}
        style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.buttonText, { color: colors.foreground, fontFamily: 'PirataOne_400Regular' }]}>
          Back to Haul
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 32 },
  wave: { fontSize: 72, marginBottom: 8 },
  title: { fontSize: 38, letterSpacing: 1 },
  sub: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  button: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  buttonText: { fontSize: 20 },
});
