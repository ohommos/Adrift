import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function ReplySentScreen() {
  const colors = useColors();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
        <Feather name="check" size={30} color={colors.seaglass} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Sent.</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        It goes straight to them. The bottle carries on to its next shore.
      </Text>
      <Pressable
        onPress={() => router.replace('/(tabs)/haul')}
        style={[styles.cta, { backgroundColor: colors.secondary }]}
      >
        <Text style={[styles.ctaText, { color: colors.foreground }]}>Back to inbox</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  badge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontFamily: 'PirataOne_400Regular' },
  body: {
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
    fontFamily: 'Spectral_400Regular',
  },
  cta: { marginTop: 40, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 999 },
  ctaText: { fontSize: 13.5, fontFamily: 'Spectral_400Regular' },
});
