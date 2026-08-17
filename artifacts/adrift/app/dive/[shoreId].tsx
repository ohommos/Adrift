import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useShores } from '@/lib/api';
import { Globe } from '@/components/Globe';

/**
 * The plunge from the planet down to a shore: the globe rushes toward the
 * viewer and fades while the shore's name rises.
 */
export default function DiveScreen() {
  const { shoreId } = useLocalSearchParams<{ shoreId: string }>();
  const colors = useColors();
  const { token } = useIdentity();
  const { data: shores } = useShores(token);
  const shore = shores?.find((s) => s.id === shoreId);

  const zoom = useRef(new Animated.Value(0)).current;
  const label = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(zoom, {
      toValue: 1,
      duration: 1250,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
    Animated.timing(label, {
      toValue: 1,
      duration: 800,
      delay: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    const t = setTimeout(() => {
      if (shoreId) router.replace(`/shore/${shoreId}`);
    }, 1250);
    return () => clearTimeout(t);
  }, [shoreId, zoom, label]);

  const scale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 6] });
  const fade = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const labelRise = label.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View style={{ transform: [{ scale }], opacity: fade }}>
        <Globe
          shores={shore ? [shore] : []}
          showDrifts={false}
          interactive={false}
          fixedRotation={shore ? -shore.lon : 0}
          fixedTilt={shore ? shore.lat * 0.8 : 12}
          size={280}
        />
      </Animated.View>

      <Animated.View
        style={[styles.label, { opacity: label, transform: [{ translateY: labelRise }] }]}
      >
        <Text style={styles.flag}>{shore?.flag}</Text>
        <Text style={[styles.name, { color: colors.foreground }]}>{shore?.name}</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Approaching the shore…</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { position: 'absolute', alignItems: 'center' },
  flag: { fontSize: 30 },
  name: { fontSize: 22, marginTop: 6, fontFamily: 'PirataOne_400Regular' },
  sub: { fontSize: 12, marginTop: 4, fontFamily: 'Spectral_400Regular' },
});
