import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { api, City } from '@/lib/api';

const FLAGS = ['🌊', '🐚', '⚓', '🗺️', '🔭', '🪝', '🌙', '⛵'];

function generateDeviceId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setIdentity } = useIdentity();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(() => pickRandom(FLAGS));
  const citiesRef = useRef<City[]>([]);

  useEffect(() => {
    api.getCities().then((cities) => { citiesRef.current = cities; }).catch(() => {});
  }, []);

  const canCast = nickname.trim().length >= 2 && nickname.trim().length <= 24;

  const handleCastOff = async () => {
    if (!canCast || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const cities = citiesRef.current;
      if (cities.length === 0) throw new Error('Could not load ports. Check your connection.');
      const homeCity = pickRandom(cities);
      const deviceId = generateDeviceId();
      const { token, identity } = await api.createIdentity(deviceId, nickname.trim(), selectedFlag, homeCity.id);
      await setIdentity(identity, token);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not reach the sea.';
      Alert.alert('The tide is out', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) + 40,
            paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Wordmark */}
        <Text style={[styles.wordmark, { color: colors.primary }]}>Adrift</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          A message in a bottle.{'\n'}Cast it. Forget it. Wait.
        </Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Nickname input */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            YOUR NAME AT SEA
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: canCast ? colors.primary : colors.border,
                color: colors.foreground,
                fontFamily: 'Spectral_400Regular',
              },
            ]}
            placeholder="e.g. saltmoth, nightbus_, tidewatcher"
            placeholderTextColor={colors.mutedForeground}
            value={nickname}
            onChangeText={setNickname}
            maxLength={24}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={handleCastOff}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            2–24 characters · this is how strangers know you
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleCastOff}
          disabled={!canCast || loading}
          activeOpacity={0.8}
          style={[
            styles.button,
            {
              backgroundColor: canCast ? colors.primary : colors.secondary,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primaryForeground, fontFamily: 'PirataOne_400Regular' }]}>
              Cast Off
            </Text>
          )}
        </TouchableOpacity>

        {/* Flag picker */}
        <Text style={[styles.label, { color: colors.mutedForeground, marginBottom: 10 }]}>
          YOUR FLAG
        </Text>
        <View style={styles.flagRow}>
          {FLAGS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => { setSelectedFlag(f); Haptics.selectionAsync(); }}
              style={[
                styles.flagBtn,
                f === selectedFlag && { backgroundColor: colors.primary + '44', borderColor: colors.primary },
                { borderColor: f === selectedFlag ? colors.primary : 'transparent' },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 32, alignItems: 'center' },
  wordmark: {
    fontSize: 64,
    fontFamily: 'PirataOne_400Regular',
    textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Spectral_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 32,
  },
  divider: {
    height: 1,
    width: '60%',
    marginBottom: 32,
    opacity: 0.4,
  },
  form: {
    width: '100%',
    gap: 8,
    marginBottom: 28,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Cinzel_400Regular',
    letterSpacing: 1.5,
  },
  input: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Spectral_400Regular',
    opacity: 0.7,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  buttonText: {
    fontSize: 22,
    letterSpacing: 1,
  },
  flagRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  flagBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: { fontSize: 22 },
});
