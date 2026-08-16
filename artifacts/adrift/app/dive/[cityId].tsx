import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useCities } from '@/lib/api';
import { Globe } from '@/components/Globe';

/**
 * The plunge from the planet to a city's shore: the globe rushes toward the
 * viewer and fades while the port's name rises.
 */
export default function DiveScreen() {
  const { cityId } = useLocalSearchParams<{ cityId: string }>();
  const colors = useColors();
  const { token } = useIdentity();
  const { data: cities } = useCities(token);
  const city = cities?.find((c) => c.id === cityId);

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
      if (cityId) router.replace(`/city/${cityId}`);
    }, 1250);
    return () => clearTimeout(t);
  }, [cityId, zoom, label]);

  const scale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 6] });
  const fade = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const labelRise = label.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View style={{ transform: [{ scale }], opacity: fade }}>
        <Globe
          cities={city ? [city] : []}
          showDrifts={false}
          interactive={false}
          fixedRotation={city ? -city.lon : 0}
          fixedTilt={city ? city.lat * 0.8 : 12}
          size={280}
        />
      </Animated.View>

      <Animated.View
        style={[styles.label, { opacity: label, transform: [{ translateY: labelRise }] }]}
      >
        <Text style={styles.flag}>{city?.flag}</Text>
        <Text style={[styles.name, { color: colors.foreground }]}>{city?.name}</Text>
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
