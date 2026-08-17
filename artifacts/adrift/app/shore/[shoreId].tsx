import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useShore, useShores } from '@/lib/api';
import { canSendToShore, findHomeShore } from '@/lib/homeShore';
import { useCompose } from '@/context/ComposeContext';
import { showAlert } from '@/lib/alert';
import { Paper, Rule, TopBar, patina, webBottom, webTop } from '@/components/ui/primitives';

/** Bottles bobbing in the shallows, as many as the shore is busy. */
function Harbour({ count }: { count: number }) {
  const colors = useColors();
  const n = Math.min(Math.round(count / 28) + 2, 14);
  return (
    <Svg width="100%" height={72} viewBox="0 0 300 72">
      {[0.3, 0.5, 0.72].map((o, i) => (
        <Path
          key={i}
          d={`M 0 ${72 * o} q 40 -9 80 0 t 80 0 t 80 0 t 80 0`}
          fill="none"
          stroke={colors.seaglass}
          strokeWidth={1}
          opacity={0.28}
        />
      ))}
      {Array.from({ length: n }).map((_, i) => {
        const x = 14 + (i * 271) / 14;
        const y = 18 + ((i * 37) % 40);
        return (
          <G key={i}>
            <Rect x={x - 2} y={y - 5} width={4} height={10} rx={1.8} fill={colors.seaglass} opacity={0.8} />
            <Rect x={x - 1} y={y - 7} width={2} height={3} rx={0.8} fill={colors.wax} />
          </G>
        );
      })}
    </Svg>
  );
}

export default function ShoreScreen() {
  const { shoreId } = useLocalSearchParams<{ shoreId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, identity } = useIdentity();
  const { data, isLoading } = useShore(token, shoreId ?? '');
  const { data: shores } = useShores(token);
  const { setTargetShoreId } = useCompose();

  const isPro = !!identity?.isPro;
  const home = findHomeShore(shores, identity);
  const isHome = !!home && home.id === shoreId;
  // Your own shore is free for everyone; any other one needs Pro.
  const canSend = data ? canSendToShore(data.shore, home, isPro) : false;
  const count = data?.shore.bottleCount ?? 0;
  const quiet = count < 20;

  const throwHere = () => {
    if (!canSend) {
      showAlert(
        'Pro required',
        `Your own shore is always free. Writing to ${data?.shore.name ?? 'another shore'} needs Pro — $5, once, forever.`
      );
      return;
    }
    setTargetShoreId(shoreId ?? null);
    router.push('/(tabs)/scrawl');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + webTop }}>
        <TopBar
          title={data?.shore.name ?? ''}
          onBack={() => router.back()}
          sub={
            data
              ? `${data.shore.flag}  |  ${count} ${count === 1 ? 'letter waiting' : 'letters waiting'}`
              : null
          }
        />
      </View>

      {isLoading || !data ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + webBottom + 60,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.harbourCard}>
            <LinearGradient
              colors={[colors.secondary, colors.card]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Harbour count={count} />
            <Text style={[styles.harbourNote, { color: colors.mutedForeground }]}>
              {count > 200
                ? 'Crowded water. Your bottle competes with hundreds, but someone will find it fast.'
                : quiet
                  ? 'Barely anyone here. A bottle thrown into this water gets read carefully.'
                  : 'Steady current. Good odds of being found within the day.'}
            </Text>
          </View>

          <Rule label="Washed up here" />
          {data.letters.map((l, i) => (
            <Paper key={`${l.nickname}-${i}`} tint={patina(l.passOnCount)} style={styles.letter}>
              <View style={styles.letterInner}>
                <Text style={[styles.letterText, { color: colors.ink }]}>{l.text}</Text>
                <Text style={[styles.letterMeta, { color: colors.ink }]}>
                  {l.nickname} · {l.passOnCount} {l.passOnCount === 1 ? 'shore' : 'shores'}
                </Text>
              </View>
            </Paper>
          ))}

          <Text style={[styles.sample, { color: colors.mutedForeground }]}>
            A sample of what is floating here. You cannot pick which one finds you.
          </Text>

          <Pressable
            onPress={throwHere}
            style={[
              styles.cta,
              {
                backgroundColor: canSend ? colors.primary : colors.secondary,
                borderColor: colors.primary,
                borderWidth: canSend ? 0 : 1,
              },
            ]}
          >
            {!canSend && <Feather name="lock" size={15} color={colors.primary} />}
            <Text
              style={[styles.ctaText, { color: canSend ? colors.background : colors.primary }]}
              numberOfLines={1}
            >
              Throw a bottle onto {data.shore.name}
            </Text>
          </Pressable>
          <Text style={[styles.ctaNote, { color: colors.mutedForeground }]}>
            {isHome
              ? 'This is your own shore — always free.'
              : isPro
                ? 'Pro lets you write to any shore on the planet.'
                : 'Writing to another shore is a Pro feature.'}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  harbourCard: { borderRadius: 24, padding: 16, marginBottom: 18, overflow: 'hidden' },
  harbourNote: { fontSize: 12, lineHeight: 19, marginTop: 6, fontFamily: 'Spectral_400Regular' },
  letter: { marginBottom: 12 },
  letterInner: { padding: 18 },
  letterText: { fontSize: 16, lineHeight: 27, fontFamily: 'IMFellEnglish_400Regular' },
  letterMeta: { fontSize: 10, marginTop: 10, opacity: 0.45, fontFamily: 'Cinzel_400Regular', letterSpacing: 0.5 },
  sample: { fontSize: 11, textAlign: 'center', marginBottom: 18, fontFamily: 'Spectral_400Regular' },
  cta: {
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  ctaText: { fontSize: 14, fontFamily: 'Spectral_600SemiBold' },
  ctaNote: { fontSize: 11, textAlign: 'center', marginTop: 9, fontFamily: 'Spectral_400Regular' },
});
