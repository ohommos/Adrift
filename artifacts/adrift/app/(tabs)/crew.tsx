import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { api, useMyBottles } from '@/lib/api';
import { showAlert, showConfirm } from '@/lib/alert';
import { CREDITS_PER_REPLY } from '@/lib/limits';
import { Rule, TopBar, webBottom, webTop } from '@/components/ui/primitives';

export default function YouScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { identity, token, refreshIdentity } = useIdentity();
  const { data: mine } = useMyBottles(token);
  const [unlocking, setUnlocking] = useState(false);

  // Derived from your own bottles — the design's three stats need no new
  // endpoint, they are all present in what Tide already fetches.
  const stats = useMemo(() => {
    const list = mine ?? [];
    const found = list.filter((b) => b.state === 'opened' || b.countries.length > 0).length;
    const shores = list.reduce((a, b) => a + b.passOnCount, 0);
    return [
      { value: String(list.length), label: 'Thrown' },
      { value: String(found), label: 'Found' },
      { value: String(shores), label: 'Shores reached' },
    ];
  }, [mine]);

  const handleUnlock = () => {
    if (!token || unlocking) return;
    showConfirm(
      'Adrift Pro',
      'Go Pro for $5 - once, forever. Unlimited replies and send to any city in the world.',
      'Unlock',
      async () => {
        setUnlocking(true);
        try {
          await api.unlockPro(token);
          await refreshIdentity();
        } catch (e: unknown) {
          showAlert('Tide turned', e instanceof Error ? e.message : 'Could not unlock Pro.');
        } finally {
          setUnlocking(false);
        }
      }
    );
  };

  if (!identity) return null;

  const credits = identity.credits;
  const toGo = Math.max(0, CREDITS_PER_REPLY - credits);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + webTop }}>
        <TopBar title="You" />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + webBottom + 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Text style={styles.avatarGlyph}>{identity.flag}</Text>
          </View>
          <Text style={[styles.nick, { color: colors.foreground }]}>{identity.nickname}</Text>
          <Text style={[styles.home, { color: colors.mutedForeground }]}>
            {identity.homeCountry === 'Unknown' ? 'Somewhere at sea' : identity.homeCountry}
          </Text>
        </View>

        <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {!identity.isPro && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Rule label="Toward your next reply" />
            <View style={styles.barRow}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.bar,
                    { backgroundColor: i < credits ? colors.primary : colors.secondary },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>
              {!identity.usedFreeReply
                ? 'Your first reply is free - it is waiting for you.'
                : credits >= CREDITS_PER_REPLY
                  ? 'You have earned a reply.'
                  : `${toGo} more ${toGo === 1 ? 'bottle' : 'bottles'} passed on or broken.`}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.card,
            {
              backgroundColor: identity.isPro ? colors.card : colors.secondary,
              borderColor: identity.isPro ? 'transparent' : colors.primary,
              borderWidth: identity.isPro ? 0 : 1,
            },
          ]}
        >
          <View style={styles.proHead}>
            <Feather
              name={identity.isPro ? 'unlock' : 'lock'}
              size={15}
              color={identity.isPro ? colors.seaglass : colors.primary}
            />
            <Text style={[styles.proTitle, { color: colors.foreground }]}>
              {identity.isPro ? 'Adrift Pro active' : 'Adrift Pro'}
            </Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>
            {identity.isPro
              ? 'Unlimited replies and any city on the planet.'
              : 'Skip the three pass-ons. Reply to anyone, any time.'}
          </Text>
          {!identity.isPro && (
            <Pressable
              onPress={handleUnlock}
              disabled={unlocking}
              style={[styles.proCta, { backgroundColor: colors.primary }]}
            >
              {unlocking ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={[styles.proCtaText, { color: colors.background }]}>Unlock for $5</Text>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  identity: { alignItems: 'center', paddingVertical: 22 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarGlyph: { fontSize: 32 },
  nick: { fontSize: 20, marginTop: 12, fontFamily: 'PirataOne_400Regular' },
  home: { fontSize: 12, marginTop: 2, fontFamily: 'Spectral_400Regular' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 19, fontFamily: 'Cinzel_700Bold' },
  statLabel: { fontSize: 11, marginTop: 2, fontFamily: 'Spectral_400Regular' },
  card: { borderRadius: 18, padding: 16, marginBottom: 12 },
  barRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  bar: { flex: 1, height: 6, borderRadius: 3 },
  cardBody: { fontSize: 12.5, lineHeight: 19, fontFamily: 'Spectral_400Regular' },
  proHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  proTitle: { fontSize: 13.5, fontFamily: 'Spectral_600SemiBold' },
  proCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 12,
    minWidth: 130,
    alignItems: 'center',
  },
  proCtaText: { fontSize: 13, fontFamily: 'Spectral_600SemiBold' },
});
