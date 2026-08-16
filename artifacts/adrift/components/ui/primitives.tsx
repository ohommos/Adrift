import React from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import type { BottleScope, BottleState } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';
import { STATE_LABEL } from '@/lib/labels';

/** Uppercase section label trailed by a hand-drawn wave rule. */
export function Rule({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={styles.ruleRow}>
      <Text style={[styles.ruleLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={styles.ruleLine}>
        <Svg height={6} width="100%" viewBox="0 0 100 6" preserveAspectRatio="none">
          <Path
            d="M0 3 q 5 -3 10 0 t 10 0 t 10 0 t 10 0 t 10 0 t 10 0 t 10 0 t 10 0 t 10 0 t 10 0"
            fill="none"
            stroke={colors.secondary}
            strokeWidth={1}
          />
        </Svg>
      </View>
    </View>
  );
}

/**
 * A sheet of letter paper. `tint` ages it — bottles that have passed through
 * many hands come up more foxed.
 */
export function Paper({
  children,
  tint = 0,
  style,
}: {
  children: React.ReactNode;
  tint?: number;
  style?: ViewStyle;
}) {
  const colors = useColors();
  return (
    <View style={[styles.paperWrap, style]}>
      <LinearGradient
        colors={[colors.parchment, colors.paperEdge]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {tint > 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(140,110,60,${tint * 0.16})` },
          ]}
          pointerEvents="none"
        />
      )}
      {/* Deckle edge */}
      <View style={styles.deckle} pointerEvents="none" />
      <View style={styles.paperInner}>{children}</View>
    </View>
  );
}

export function ScopeBadge({ scope }: { scope: BottleScope }) {
  const colors = useColors();
  return (
    <View style={[styles.scopeBadge, { backgroundColor: colors.seaglass }]}>
      <Text style={[styles.scopeBadgeText, { color: colors.background }]}>
        {scope === 'city' ? 'City' : 'Global'}
      </Text>
    </View>
  );
}

export function StateChip({ state }: { state: BottleState }) {
  const colors = useColors();
  const col =
    state === 'opened'
      ? colors.seaglass
      : state === 'lost'
        ? colors.mutedForeground
        : colors.primary;
  return <Text style={[styles.stateChip, { color: col }]}>{STATE_LABEL[state]}</Text>;
}

/** Three pips showing progress toward the next reply. */
export function CreditPip({ credits }: { credits: number }) {
  const colors = useColors();
  return (
    <View style={[styles.pipWrap, { backgroundColor: colors.card }]}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.pip,
            { backgroundColor: i < credits ? colors.primary : colors.secondary },
          ]}
        />
      ))}
      <Text style={[styles.pipLabel, { color: colors.mutedForeground }]}>reply</Text>
    </View>
  );
}

/** How many shores a bottle has touched. Hidden until it has passed on once. */
export function Shores({ n }: { n: number }) {
  const colors = useColors();
  if (n <= 1) return null;
  return (
    <View style={styles.shoresRow}>
      <Feather name="repeat" size={10} color={colors.primary} />
      <Text style={[styles.shoresText, { color: colors.primary }]}>{n} shores</Text>
    </View>
  );
}

/** Centred, letter-spaced screen title with an optional back chevron. */
export function TopBar({
  title,
  onBack,
  sub,
}: {
  title: string;
  onBack?: () => void;
  sub?: string | null;
}) {
  const colors = useColors();
  return (
    <View style={styles.topBar}>
      <View style={styles.topBarRow}>
        <View style={styles.topBarSide}>
          {onBack && (
            <Feather name="chevron-left" size={24} color={colors.foreground} onPress={onBack} />
          )}
        </View>
        <Text style={[styles.topBarTitle, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.topBarSide} />
      </View>
      {!!sub && (
        <Text style={[styles.topBarSub, { color: colors.mutedForeground }]}>{sub}</Text>
      )}
    </View>
  );
}

/** How aged a letter looks, from the number of shores it has reached. */
export const patina = (shores: number) => Math.min(Math.max(shores - 1, 0) / 8, 1);

export const webTop = Platform.OS === 'web' ? 67 : 0;
export const webBottom = Platform.OS === 'web' ? 34 : 0;

const styles = StyleSheet.create({
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 12 },
  ruleLabel: {
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontFamily: 'Cinzel_400Regular',
  },
  ruleLine: { flex: 1 },

  paperWrap: { borderRadius: 4, overflow: 'hidden' },
  paperInner: { padding: 0 },
  deckle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(42,38,34,0.10)',
  },

  scopeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  scopeBadgeText: { fontSize: 10, fontFamily: 'Cinzel_400Regular' },

  stateChip: { fontSize: 11, fontFamily: 'Cinzel_400Regular' },

  pipWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pip: { width: 6, height: 6, borderRadius: 3 },
  pipLabel: { fontSize: 10.5, marginLeft: 2, fontFamily: 'Cinzel_400Regular' },

  shoresRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  shoresText: { fontSize: 10.5, fontFamily: 'Cinzel_400Regular' },

  topBar: { paddingTop: 12, paddingBottom: 8, paddingHorizontal: 20 },
  topBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarSide: { width: 36 },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontFamily: 'Cinzel_400Regular',
  },
  topBarSub: { fontSize: 12, textAlign: 'center', marginTop: 3, fontFamily: 'Spectral_400Regular' },
});
