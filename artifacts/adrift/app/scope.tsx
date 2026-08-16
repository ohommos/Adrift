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
import { api, useCities } from '@/lib/api';
import { showAlert } from '@/lib/alert';
import { SCOPES } from '@/lib/limits';
import { SealButton } from '@/components/SealButton';
import { TopBar, webBottom, webTop } from '@/components/ui/primitives';

export default function ScopeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, identity, refreshIdentity } = useIdentity();
  const { text, targetCityId, clearDraft } = useCompose();
  const { data: cities } = useCities(token);
  const [scope, setScope] = useState<BottleScope>(targetCityId ? 'city' : 'global');
  const [casting, setCasting] = useState(false);

  const targetCity = cities?.find((c) => c.id === targetCityId) ?? null;
  const isPro = !!identity?.isPro;

  const cast = async () => {
    if (!token || casting) return;
    setCasting(true);
    try {
      await api.createBottle(token, text, scope === 'city' ? (targetCityId ?? undefined) : undefined);
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
    if (id === 'city' && !isPro) {
      showAlert(
        'Pro required',
        'Targeting a specific city requires a Pro account. Upgrade for $5, once, forever.'
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
        {targetCity && (
          <View style={[styles.targeted, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Feather name="map-pin" size={15} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.targetedTitle, { color: colors.foreground }]}>
                Targeted at {targetCity.flag} {targetCity.name}
              </Text>
              <Text style={[styles.targetedSub, { color: colors.mutedForeground }]}>
                Chosen from the planet view
              </Text>
            </View>
          </View>
        )}

        {SCOPES.map((s) => {
          const active = scope === s.id;
          const locked = s.id === 'city' && !isPro;
          return (
            <Pressable
              key={s.id}
              onPress={() => pickScope(s.id)}
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
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>{s.label}</Text>
                {locked && <Feather name="lock" size={13} color={colors.primary} />}
              </View>
              <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
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
  optionLabel: { fontSize: 15, fontFamily: 'Spectral_600SemiBold' },
  optionDesc: { fontSize: 12, marginTop: 3, lineHeight: 18, fontFamily: 'Spectral_400Regular' },
  deal: { borderRadius: 18, padding: 16, marginTop: 4 },
  dealText: { fontSize: 12, lineHeight: 19, fontFamily: 'Spectral_400Regular' },
  sealWrap: { alignItems: 'center', marginTop: 28 },
});
