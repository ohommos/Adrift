import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useBottle } from '@/lib/api';
import { DriftMap } from '@/components/DriftMap';
import { Paper, TopBar, patina, webBottom, webTop } from '@/components/ui/primitives';

export default function TrackerScreen() {
  const { bottleId } = useLocalSearchParams<{ bottleId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useIdentity();
  const { data: bottle, isLoading } = useBottle(token, bottleId ?? '');

  if (isLoading || !bottle) {
    return (
      <View style={[styles.root, styles.centre, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const opened = bottle.state === 'opened';
  const lost = bottle.state === 'lost';
  const headline = opened
    ? 'Someone opened it.'
    : lost
      ? 'Lost at sea.'
      : 'Still drifting.';
  const blurb = opened
    ? 'You will never know who - unless they write back.'
    : lost
      ? 'It never reached anyone. Most bottles do not.'
      : `Somewhere in the ${bottle.region}. No telling how long.`;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + webTop }}>
        <TopBar title="" onBack={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + webBottom + 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapCard}>
          <LinearGradient
            colors={[colors.secondary, colors.card]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <DriftMap progress={bottle.progress} state={bottle.state} />
        </View>

        <Text
          style={[
            styles.headline,
            { color: opened ? colors.seaglass : lost ? colors.mutedForeground : colors.foreground },
          ]}
        >
          {headline}
        </Text>
        <Text style={[styles.blurb, { color: colors.mutedForeground }]}>{blurb}</Text>

        {bottle.countries.length > 0 && (
          <View style={[styles.panel, { backgroundColor: colors.card }]}>
            <Text style={[styles.panelLabel, { color: colors.seaglass }]}>OPENED IN</Text>
            {bottle.countries.map((c, i) => (
              <View
                key={c}
                style={[
                  styles.countryRow,
                  {
                    borderBottomWidth: i < bottle.countries.length - 1 ? 1 : 0,
                    borderBottomColor: 'rgba(255,255,255,0.05)',
                  },
                ]}
              >
                <Text style={[styles.countryName, { color: colors.foreground }]}>{c}</Text>
                <Text style={[styles.countryOrder, { color: colors.mutedForeground }]}>
                  {i === 0 ? 'first' : `shore ${i + 1}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {bottle.passOnCount > 0 && (
          <View style={[styles.panel, { backgroundColor: colors.card }]}>
            <Text style={[styles.panelLabel, { color: colors.primary }]}>
              PASSED ON {bottle.passOnCount} {bottle.passOnCount === 1 ? 'TIME' : 'TIMES'}
            </Text>
            <View style={styles.trail}>
              {Array.from({ length: Math.min(bottle.passOnCount, 10) }).map((_, i, arr) => (
                <React.Fragment key={i}>
                  <View
                    style={[
                      styles.trailDot,
                      { backgroundColor: i === 0 ? colors.primary : colors.seaglass },
                    ]}
                  />
                  {i < arr.length - 1 && (
                    <View style={[styles.trailLine, { backgroundColor: colors.secondary }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
            <Text style={[styles.trailNote, { color: colors.mutedForeground }]}>
              Each reader chose to throw it back in.
            </Text>
          </View>
        )}

        <Paper tint={patina(bottle.passOnCount)} style={{ marginTop: 12 }}>
          <View style={styles.letterInner}>
            <Text style={[styles.letter, { color: colors.ink }]}>{bottle.text}</Text>
          </View>
        </Paper>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  mapCard: { borderRadius: 24, padding: 16, marginBottom: 20, overflow: 'hidden' },
  headline: { fontSize: 21, textAlign: 'center', fontFamily: 'PirataOne_400Regular' },
  blurb: {
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
    fontFamily: 'Spectral_400Regular',
  },
  panel: { borderRadius: 18, padding: 16, marginTop: 16 },
  panelLabel: { fontSize: 11, letterSpacing: 1, marginBottom: 10, fontFamily: 'Cinzel_400Regular' },
  countryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  countryName: { fontSize: 13.5, fontFamily: 'Spectral_400Regular' },
  countryOrder: { fontSize: 10.5, fontFamily: 'Cinzel_400Regular' },
  trail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trailDot: { width: 8, height: 8, borderRadius: 4 },
  trailLine: { flex: 1, height: 1 },
  trailNote: { fontSize: 11.5, marginTop: 8, fontFamily: 'Spectral_400Regular' },
  letterInner: { padding: 22 },
  letter: { fontSize: 17, lineHeight: 30, fontFamily: 'IMFellEnglish_400Regular' },
});
