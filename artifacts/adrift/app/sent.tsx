import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function SentScreen() {
  const colors = useColors();
  const [phase, setPhase] = useState(0);
  const ripple = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 1500);
    Animated.loop(
      Animated.timing(ripple, { toValue: 1, duration: 2800, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    return () => clearTimeout(t);
  }, [ripple, bob]);

  const scale = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.4] });
  const opacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.ripple,
            { borderColor: colors.seaglass, transform: [{ scale }], opacity },
          ]}
        />
        <Animated.View style={{ transform: [{ translateY }], alignItems: 'center' }}>
          <View style={[styles.cork, { backgroundColor: colors.wax }]} />
          <View style={[styles.bottle, { backgroundColor: colors.parchment }]} />
        </Animated.View>
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>Sealed and adrift.</Text>
      {phase === 1 && (
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          It is on the current now. We will tell you if someone opens it - never who.
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={[styles.cta, { backgroundColor: colors.secondary }]}
        >
          <Text style={[styles.ctaText, { color: colors.foreground }]}>Track it on the tide</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/(tabs)/chart')} style={styles.linkCta}>
          <Feather name="globe" size={14} color={colors.seaglass} />
          <Text style={[styles.linkText, { color: colors.seaglass }]}>See it on the planet</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  stage: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ripple: { position: 'absolute', width: 88, height: 88, borderRadius: 44, borderWidth: 1 },
  cork: { width: 8, height: 10, borderRadius: 4 },
  bottle: { width: 16, height: 36, borderRadius: 8, marginTop: -2 },
  title: { fontSize: 22, fontFamily: 'PirataOne_400Regular' },
  body: {
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
    fontFamily: 'Spectral_400Regular',
  },
  actions: { marginTop: 36, alignItems: 'center', gap: 8 },
  cta: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 999 },
  ctaText: { fontSize: 13.5, fontFamily: 'Spectral_400Regular' },
  linkCta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  linkText: { fontSize: 13, fontFamily: 'Spectral_400Regular' },
});
