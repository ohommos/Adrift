import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Shore } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { api, useShores, useSuggestedShore } from '@/lib/api';
import { ShorePicker } from '@/components/ShorePicker';
import { webBottom, webTop } from '@/components/ui/primitives';

/**
 * The one screen an account without a shore can reach.
 *
 * Nobody in Adrift is placeless: your shore decides what drifts within reach
 * of you, what you can write to for free, and how long your letters spend at
 * sea. Onboarding has required it since shores existed, so only accounts made
 * before that land here — and they land here before anything else.
 */
export default function PickShoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, refreshIdentity } = useIdentity();
  const { data: shores } = useShores(token);
  const { data: suggestion } = useSuggestedShore();
  const [choice, setChoice] = useState<Shore | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!token || !choice || saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.setHomeShore(token, choice.id);
      // The redirect in _layout.tsx clears once the identity carries a shore.
      await refreshIdentity();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not reach the sea.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={{
          paddingTop: insets.top + webTop + 24,
          paddingBottom: insets.bottom + webBottom + 24,
          paddingHorizontal: 24,
          flex: 1,
        }}
      >
        <Text style={[styles.title, { color: colors.primary }]}>Where do you stand?</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Every bottle is thrown from somewhere. Pick your shore — it is where
          bottles will wash up for you, and writing to it is always free.
        </Text>

        <View style={{ flex: 1, marginTop: 20 }}>
          <ShorePicker
            shores={shores ?? []}
            selectedId={choice?.id ?? null}
            onSelect={setChoice}
            suggested={suggestion?.shore ?? null}
            maxHeight={420}
          />
        </View>

        {error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}

        <Pressable
          onPress={confirm}
          disabled={!choice || saving}
          style={[
            styles.cta,
            { backgroundColor: choice ? colors.primary : colors.secondary },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text
              style={[
                styles.ctaText,
                { color: choice ? colors.background : colors.mutedForeground },
              ]}
            >
              {choice ? `Stand on ${choice.name}` : 'Pick a shore'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 30, fontFamily: 'PirataOne_400Regular' },
  body: { fontSize: 13.5, lineHeight: 21, marginTop: 8, fontFamily: 'Spectral_400Regular' },
  error: { fontSize: 13, marginTop: 12, fontFamily: 'Spectral_400Regular' },
  cta: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  ctaText: { fontSize: 16, fontFamily: 'Spectral_600SemiBold' },
});
