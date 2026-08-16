import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottleSummary } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useMyBottles } from '@/lib/api';
import { DriftMap } from '@/components/DriftMap';
import { EmptyState } from '@/components/EmptyState';
import {
  CreditPip,
  Rule,
  ScopeBadge,
  Shores,
  StateChip,
  webBottom,
  webTop,
} from '@/components/ui/primitives';

function DriftCard({ bottle, onPress }: { bottle: BottleSummary; onPress: () => void }) {
  const colors = useColors();
  const lost = bottle.state === 'lost';
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: 'rgba(79,224,192,0.09)', opacity: lost ? 0.62 : 1 },
      ]}
    >
      <View style={styles.cardHead}>
        <View style={styles.cardHeadLeft}>
          <ScopeBadge scope={bottle.scope} />
          <Shores n={bottle.passOnCount} />
        </View>
        <StateChip state={bottle.state} />
      </View>

      <DriftMap progress={bottle.progress} state={bottle.state} small />

      <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
        {lost ? 'Never found' : bottle.region}
        {bottle.countries.length
          ? ` · opened in ${bottle.countries.length} ${bottle.countries.length === 1 ? 'country' : 'countries'}`
          : ''}
      </Text>

      <Text style={[styles.cardText, { color: colors.foreground }]} numberOfLines={2}>
        “{bottle.text}”
      </Text>
    </Pressable>
  );
}

export default function TideScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, identity } = useIdentity();
  const { data: bottles, isLoading, refetch, isRefetching } = useMyBottles(token);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + webTop + 16,
          paddingBottom: insets.bottom + webBottom + 140,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.wordmark, { color: colors.foreground }]}>ADRIFT</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              The water never stops moving.
            </Text>
          </View>
          <CreditPip credits={identity?.credits ?? 0} />
        </View>

        <View style={styles.ruleWrap}>
          <Rule label="Your bottles" />
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : !bottles?.length ? (
          <EmptyState
            icon="wind"
            title="Nothing at sea yet"
            subtitle="Write something, seal it, and let the current take it."
          />
        ) : (
          bottles.map((b) => (
            <DriftCard key={b.id} bottle={b} onPress={() => router.push(`/tracker/${b.id}`)} />
          ))
        )}

        <Pressable
          onPress={() => router.push('/(tabs)/scrawl')}
          style={[styles.primaryCta, { backgroundColor: colors.primary }]}
        >
          <Feather name="send" size={15} color={colors.background} />
          <Text style={[styles.primaryCtaText, { color: colors.background }]}>Throw a bottle</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/chart')}
          style={[styles.secondaryCta, { backgroundColor: colors.card }]}
        >
          <Feather name="globe" size={14} color={colors.seaglass} />
          <Text style={[styles.secondaryCtaText, { color: colors.seaglass }]}>
            See them on the planet
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerText: { flex: 1 },
  wordmark: { fontSize: 30, fontFamily: 'PirataOne_400Regular', letterSpacing: 6 },
  tagline: {
    fontSize: 13,
    fontFamily: 'Spectral_400Regular_Italic',
    fontStyle: 'italic',
    marginTop: 1,
  },
  ruleWrap: { marginTop: 20 },
  card: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardMeta: { fontSize: 11, marginBottom: 6, fontFamily: 'Cinzel_400Regular' },
  cardText: { fontSize: 13, lineHeight: 20, fontFamily: 'Spectral_400Regular' },
  primaryCta: {
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  primaryCtaText: { fontSize: 14, fontFamily: 'Spectral_600SemiBold' },
  secondaryCta: {
    height: 44,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  secondaryCtaText: { fontSize: 13, fontFamily: 'Spectral_400Regular' },
});
