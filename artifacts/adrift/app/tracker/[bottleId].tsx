import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Circle, Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useBottle } from '@/lib/api';
import { LetterView } from '@/components/LetterView';

const MAP_W = 300;
const MAP_H = 150;
function projX(lon: number) { return ((lon + 180) / 360) * MAP_W; }
function projY(lat: number) { return ((90 - lat) / 180) * MAP_H; }

const STATUS_LABELS: Record<string, string> = {
  drifting: 'Drifting',
  beached: 'Beached',
  sunk: 'Lost at sea',
  opened: 'Found',
};

export default function TrackerScreen() {
  const { bottleId } = useLocalSearchParams<{ bottleId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useIdentity();
  const { data: bottle, isLoading } = useBottle(token, bottleId ?? '');

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const statusColor =
    !bottle ? colors.mutedForeground
    : bottle.status === 'sunk' ? colors.wax
    : bottle.openCount > 0 ? colors.seaglass
    : colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { paddingTop: topPad + 16 }]}
      >
        <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>

      {isLoading || !bottle ? (
        <View style={styles.center}>
          <Text style={[styles.loading, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
            Tracking…
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Status */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor, fontFamily: 'Cinzel_400Regular' }]}>
              {STATUS_LABELS[bottle.status] ?? bottle.status}
            </Text>
          </View>

          {/* Mini map */}
          {bottle.currentLat !== undefined && bottle.currentLon !== undefined && (
            <View style={styles.mapWrap}>
              <Svg width={MAP_W} height={MAP_H}>
                <Rect x={0} y={0} width={MAP_W} height={MAP_H} fill={colors.card} rx={8} />
                <Line x1={0} y1={MAP_H / 2} x2={MAP_W} y2={MAP_H / 2} stroke={colors.border} strokeWidth={0.5} opacity={0.4} />
                <Line x1={MAP_W / 2} y1={0} x2={MAP_W / 2} y2={MAP_H} stroke={colors.border} strokeWidth={0.5} opacity={0.4} />
                <Circle
                  cx={projX(bottle.currentLon)}
                  cy={projY(bottle.currentLat)}
                  r={8}
                  fill={colors.primary}
                  opacity={0.9}
                />
                <Circle
                  cx={projX(bottle.currentLon)}
                  cy={projY(bottle.currentLat)}
                  r={3}
                  fill="white"
                />
              </Svg>
              {bottle.currentOcean && (
                <Text style={[styles.oceanLabel, { color: colors.mutedForeground, fontFamily: 'Cinzel_400Regular' }]}>
                  {bottle.currentOcean}
                </Text>
              )}
            </View>
          )}

          {/* Stats */}
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <Stat icon="wind" label="Days adrift" value={`${bottle.driftDays}`} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <Stat icon="eye" label="Times opened" value={`${bottle.openCount}`} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <Stat icon="globe" label="Countries" value={`${bottle.countriesVisited}`} colors={colors} />
          </View>

          {/* Letter preview */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Cinzel_400Regular' }]}>
            YOUR MESSAGE
          </Text>
          <LetterView text={bottle.text} />
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ icon, label, value, colors }: {
  icon: string; label: string; value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.stat}>
      <Feather name={icon as never} size={16} color={colors.mutedForeground} />
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: 'PirataOne_400Regular' }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Cinzel_400Regular' }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { fontSize: 16 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, letterSpacing: 1 },
  mapWrap: { alignItems: 'center', gap: 8 },
  oceanLabel: { fontSize: 11, letterSpacing: 1.5 },
  statsCard: {
    borderRadius: 14,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 28 },
  statLabel: { fontSize: 10, letterSpacing: 0.5 },
  statDivider: { width: 1, height: 40 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5, marginBottom: -4 },
});
