import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Svg, {
  Rect,
  Line,
  Circle,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useCities } from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';

const MAP_W = 1100;
const MAP_H = 520;

function projX(lon: number) {
  return ((lon + 180) / 360) * MAP_W;
}
function projY(lat: number) {
  return ((90 - lat) / 180) * MAP_H;
}

const OCEANS = [
  { name: 'NORTH ATLANTIC', lon: -35, lat: 38 },
  { name: 'SOUTH ATLANTIC', lon: -18, lat: -22 },
  { name: 'NORTH PACIFIC', lon: -155, lat: 28 },
  { name: 'SOUTH PACIFIC', lon: -128, lat: -28 },
  { name: 'INDIAN OCEAN', lon: 75, lat: -15 },
  { name: 'ARCTIC', lon: 10, lat: 83 },
  { name: 'SOUTHERN OCEAN', lon: 0, lat: -62 },
  { name: 'MEDITERRANEAN', lon: 18, lat: 37 },
];

const LAT_LINES = [-60, -30, 0, 30, 60];
const LON_LINES = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

export default function ChartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useIdentity();
  const { data: cities, isLoading } = useCities(token);
  const scrollRef = useRef<ScrollView>(null);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const headerH = topPad + 80;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.screenTitle, { color: colors.primary }]}>Chart</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {cities?.length ?? 0} ports charted
        </Text>
      </View>

      {/* Map canvas */}
      {isLoading ? null : !cities?.length ? (
        <EmptyState icon="map" title="Chart unavailable" subtitle="Could not load port data" />
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mapScroll}
          contentContainerStyle={{ width: MAP_W }}
        >
          <Svg width={MAP_W} height={MAP_H}>
            {/* Ocean background */}
            <Rect x={0} y={0} width={MAP_W} height={MAP_H} fill={colors.card} />

            {/* Graticule */}
            {LAT_LINES.map((lat) => (
              <Line
                key={`lat${lat}`}
                x1={0}
                y1={projY(lat)}
                x2={MAP_W}
                y2={projY(lat)}
                stroke={colors.border}
                strokeWidth={lat === 0 ? 1.2 : 0.5}
                opacity={lat === 0 ? 0.6 : 0.35}
              />
            ))}
            {LON_LINES.map((lon) => (
              <Line
                key={`lon${lon}`}
                x1={projX(lon)}
                y1={0}
                x2={projX(lon)}
                y2={MAP_H}
                stroke={colors.border}
                strokeWidth={0.5}
                opacity={0.25}
              />
            ))}

            {/* Ocean labels */}
            {OCEANS.map((o) => (
              <SvgText
                key={o.name}
                x={projX(o.lon)}
                y={projY(o.lat)}
                fill={colors.mutedForeground}
                fontSize={8}
                textAnchor="middle"
                opacity={0.45}
                letterSpacing={1.5}
              >
                {o.name}
              </SvgText>
            ))}

            {/* City dots */}
            {cities.map((city) => {
              const cx = projX(city.lon);
              const cy = projY(city.lat);
              return (
                <G
                  key={city.id}
                  onPress={() => router.push(`/city/${city.id}`)}
                >
                  <Circle cx={cx} cy={cy} r={12} fill={colors.primary} opacity={0.15} />
                  <Circle cx={cx} cy={cy} r={5} fill={colors.primary} opacity={0.9} />
                  <Circle cx={cx} cy={cy} r={2} fill="white" />
                  <SvgText
                    x={cx}
                    y={cy + 18}
                    fill={colors.foreground}
                    fontSize={9}
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {city.flag} {city.name}
                  </SvgText>
                  {city.bottleCount > 0 && (
                    <SvgText
                      x={cx}
                      y={cy + 27}
                      fill={colors.seaglass}
                      fontSize={8}
                      textAnchor="middle"
                    >
                      {city.bottleCount}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>
        </ScrollView>
      )}

      {/* City quick-list */}
      <View style={[styles.portList, { borderTopColor: colors.border }]}>
        <Text style={[styles.portListLabel, { color: colors.mutedForeground }]}>PORTS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portChips}>
          {cities?.map((city) => (
            <TouchableOpacity
              key={city.id}
              onPress={() => router.push(`/city/${city.id}`)}
              activeOpacity={0.7}
              style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.chipText, { color: colors.foreground, fontFamily: 'Cinzel_400Regular' }]}>
                {city.flag} {city.name}
              </Text>
              {city.bottleCount > 0 && (
                <View style={[styles.chipBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.chipBadgeText, { color: colors.primaryForeground }]}>
                    {city.bottleCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 34,
    fontFamily: 'PirataOne_400Regular',
    letterSpacing: 1,
  },
  sub: {
    fontSize: 13,
    fontFamily: 'Spectral_400Regular',
    marginTop: 2,
  },
  mapScroll: {
    flex: 1,
  },
  portList: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
  },
  portListLabel: {
    fontSize: 10,
    fontFamily: 'Cinzel_400Regular',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  portChips: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  chipBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipBadgeText: {
    fontSize: 10,
    fontFamily: 'Cinzel_400Regular',
  },
});
