import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottleScope } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useCompose } from '@/context/ComposeContext';
import { api, useShores } from '@/lib/api';
import { showAlert } from '@/lib/alert';
import { findHomeShore } from '@/lib/homeShore';
import { SealButton } from '@/components/SealButton';
import { TopBar, webBottom, webTop } from '@/components/ui/primitives';

export default function ScopeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, identity, refreshIdentity } = useIdentity();
  const { text, targetShoreId, clearDraft } = useCompose();
  const { data: shores } = useShores(token);
  const [scope, setScope] = useState<BottleScope>(targetShoreId ? 'shore' : 'ocean');
  const [casting, setCasting] = useState(false);

  const isPro = !!identity?.isPro;
  const home = findHomeShore(shores, identity);
  // A shore chosen from the planet wins; otherwise "a shore" means your own.
  const chosenShore = shores?.find((s) => s.id === targetShoreId) ?? null;
  const shoreTarget = chosenShore ?? home;
  // Your own shore is always free. Any other one is the Pro feature.
  const shoreIsFree = !!shoreTarget && !!home && shoreTarget.id === home.id;
  const shoreLocked = !shoreTarget || (!shoreIsFree && !isPro);

  const options: Array<{ id: BottleScope; label: string; desc: string }> = [
    {
      id: 'shore',
      label: shoreTarget ? `${shoreTarget.flag} ${shoreTarget.name}` : 'A shore',
      desc: !shoreTarget
        ? 'You have not picked your shore yet.'
        : shoreIsFree
          ? 'It waits where you live. Only people from your shore will find it — a smaller, closer sea, and always free.'
          : `Writing to ${shoreTarget.name} is a Pro feature. Your own shore is always free.`,
    },
    {
      id: 'ocean',
      label: 'The Open Ocean',
      desc: "It drifts. Whoever it passes can pull it out, and you'll see where it has been.",
    },
  ];

  const cast = async () => {
    if (!token || casting) return;
    setCasting(true);
    try {
      await api.createBottle(
        token,
        text,
        scope === 'shore' ? (shoreTarget?.id ?? undefined) : undefined
      );
      await refreshIdentity();
      clearDraft();
      router.replace('/sent');
    } catch (e: unknown) {
      showAlert('Bottle sank', e instanceof Error ? e.message : 'Could not cast bottle.');
    } finally {
      setCasting(false);
    }
  };

  const pickScope = (id: BottleScope) => {
    if (id === 'shore' && shoreLocked) {
      showAlert(
        !shoreTarget ? 'No shore yet' : 'Pro required',
        !shoreTarget
          ? 'Pick your shore from your profile first. The open ocean is always available.'
          : `Your own shore is always free. Writing to ${shoreTarget.name} needs Pro — $5, once, forever.`
      );
      return;
    }
    setScope(id);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + webTop }}>
        <TopBar title="Choose your ocean" onBack={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + webBottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {chosenShore && (
          <View style={[styles.targeted, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Feather name="map-pin" size={15} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.targetedTitle, { color: colors.foreground }]}>
                Addressed to {chosenShore.flag} {chosenShore.name}
              </Text>
              <Text style={[styles.targetedSub, { color: colors.mutedForeground }]}>
                Chosen from the planet view
              </Text>
            </View>
          </View>
        )}

        {options.map((o) => {
          const active = scope === o.id;
          const locked = o.id === 'shore' && shoreLocked;
          return (
            <Pressable
              key={o.id}
              onPress={() => pickScope(o.id)}
              style={[
                styles.option,
                {
                  backgroundColor: active ? colors.secondary : colors.card,
                  borderColor: active ? colors.primary : 'transparent',
                  opacity: locked ? 0.6 : 1,
                },
              ]}
            >
              <View style={styles.optionHead}>
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>{o.label}</Text>
                {locked && <Feather name="lock" size={13} color={colors.primary} />}
                {o.id === 'shore' && shoreIsFree && (
                  <Text style={[styles.freeTag, { color: colors.seaglass }]}>FREE</Text>
                )}
              </View>
              <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{o.desc}</Text>
            </Pressable>
          );
        })}

        <View style={[styles.deal, { backgroundColor: colors.card }]}>
          <Text style={[styles.dealText, { color: colors.mutedForeground }]}>
            There is no telling how long it drifts, or whether anyone opens it. That is the deal.
          </Text>
        </View>

        <View style={styles.sealWrap}>
          {casting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <SealButton onDone={cast} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  targeted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  targetedTitle: { fontSize: 13.5, fontFamily: 'Spectral_400Regular' },
  targetedSub: { fontSize: 11, marginTop: 2, fontFamily: 'Spectral_400Regular' },
  option: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freeTag: { fontSize: 9.5, letterSpacing: 1, fontFamily: 'Cinzel_700Bold' },
  optionLabel: { fontSize: 15, fontFamily: 'Spectral_600SemiBold' },
  optionDesc: { fontSize: 12, marginTop: 3, lineHeight: 18, fontFamily: 'Spectral_400Regular' },
  deal: { borderRadius: 18, padding: 16, marginTop: 4 },
  dealText: { fontSize: 12, lineHeight: 19, fontFamily: 'Spectral_400Regular' },
  sealWrap: { alignItems: 'center', marginTop: 28 },
});
