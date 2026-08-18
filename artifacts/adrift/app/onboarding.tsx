import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { api, useShores, useSuggestedShore } from '@/lib/api';
import { getStoredItem, setStoredItem } from '@/lib/storage';
import { ShorePicker } from '@/components/ShorePicker';
import { TAGLINE } from '@/lib/brand';
import type { Shore } from '@adrift/shared';

const DEVICE_ID_KEY = 'adrift.deviceId';

// The id has to survive across attempts. A fresh one per tap makes the
// server's "return the existing identity for this device" branch unreachable,
// so a signup that creates the account but fails before the token is stored
// leaves the nickname taken with no way for its owner to claim it back.
async function getDeviceId(): Promise<string> {
  const existing = await getStoredItem(DEVICE_ID_KEY).catch(() => null);
  if (existing) return existing;
  const fresh = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  await setStoredItem(DEVICE_ID_KEY, fresh).catch(() => {});
  return fresh;
}

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setIdentity } = useIdentity();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taken, setTaken] = useState<string | null>(null);
  const [home, setHome] = useState<Shore | null>(null);
  const { data: shores } = useShores(null);
  const { data: suggestion } = useSuggestedShore();
  const suggested = suggestion?.shore ?? null;

  // Pre-select the guess so the common case is one tap, while leaving it
  // fully overridable — the guess is wrong often enough (VPNs, carriers,
  // travel) that it must never be the thing that decides.
  useEffect(() => {
    if (!home && suggested) setHome(suggested);
  }, [home, suggested]);

  const trimmed = nickname.trim();
  const wellFormed = trimmed.length >= 2 && trimmed.length <= 24;
  const canCast = wellFormed && taken !== trimmed.toLowerCase() && !!home;

  // Tell the user their name is gone while they are still typing, rather than
  // only after they commit to it.
  useEffect(() => {
    if (!wellFormed) {
      setTaken(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { available } = await api.checkNickname(trimmed);
        if (!cancelled) setTaken(available ? null : trimmed.toLowerCase());
      } catch {
        // Availability is a courtesy — signup still reports the real answer.
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, wellFormed]);

  const notice =
    error ?? (taken === trimmed.toLowerCase() ? 'That name is already taken — try another' : null);

  const handleCastOff = async () => {
    if (!canCast || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);
    try {
      const deviceId = await getDeviceId();
      if (!home) return;
      const { token, identity } = await api.createIdentity(deviceId, trimmed, home.id);
      await setIdentity(identity, token);
      // Navigation is handled by _layout.tsx watching hasIdentity
    } catch (e: unknown) {
      // Shown inline rather than through Alert.alert — react-native-web's
      // Alert is a no-op, which left web users tapping a button that
      // silently did nothing.
      setError(e instanceof Error ? e.message : 'Could not reach the sea.');
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
        {/* What the app is for, above what it is — the promise reads first,
            the mechanics explain it underneath. */}
        <Text style={[styles.motto, { color: colors.primary }]}>{TAGLINE}</Text>
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
                borderColor: notice
                  ? colors.destructive
                  : canCast
                    ? colors.primary
                    : colors.border,
                color: colors.foreground,
                fontFamily: 'Spectral_400Regular',
              },
            ]}
            placeholder="e.g. saltmoth, nightbus_, tidewatcher"
            placeholderTextColor={colors.mutedForeground}
            value={nickname}
            onChangeText={(t) => {
              setNickname(t);
              if (error) setError(null);
            }}
            maxLength={24}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={handleCastOff}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            2–24 characters · this is how strangers know you
          </Text>
          {notice && (
            <Text style={[styles.error, { color: colors.destructive }]}>
              {notice}
            </Text>
          )}
        </View>

        {/* Home shore */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            YOUR SHORE
          </Text>
          <ShorePicker
            shores={shores ?? []}
            selectedId={home?.id ?? null}
            onSelect={setHome}
            suggested={suggested}
            maxHeight={260}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            {home
              ? `${home.flag} ${home.name} is your shore. Writing to it is always free, and it is where bottles find you.`
              : 'Everyone in Adrift stands on a shore. Pick yours.'}
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
            <Text style={[styles.buttonText, { color: colors.primaryForeground, fontFamily: 'Spectral_600SemiBold' }]}>
              Cast Off
            </Text>
          )}
        </TouchableOpacity>

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
  motto: {
    fontSize: 11,
    fontFamily: 'Cinzel_400Regular',
    textAlign: 'center',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 10,
    opacity: 0.75,
    // letterSpacing adds a trailing gap after the last character, which
    // shifts centred text left by that much. Pay it back on the left.
    paddingLeft: 2.2,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Spectral_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 18,
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
  error: {
    fontSize: 13,
    fontFamily: 'Spectral_400Regular',
    lineHeight: 18,
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
});
