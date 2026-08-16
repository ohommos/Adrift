import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { City } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useCities, useMyBottles } from '@/lib/api';
import { Globe, type DriftPin } from '@/components/Globe';
import { Rule, webBottom, webTop } from '@/components/ui/primitives';

export default function PlanetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useIdentity();
  const { data: cities } = useCities(token);
  const { data: mine } = useMyBottles(token);
  const [showMine, setShowMine] = useState(true);
  const [selected, setSelected] = useState<City | null>(null);

  const total = useMemo(
    () => (cities ?? []).reduce((a, c) => a + c.bottleCount, 0),
    [cities]
  );

  const drifts: DriftPin[] = useMemo(
    () =>
      (mine ?? [])
        .filter((b) => b.state !== 'lost')
        .map((b) => ({
          id: b.id,
          lat: b.currentLat,
          lon: b.currentLon,
          opened: b.state === 'opened',
        })),
    [mine]
  );

  const busiest = useMemo(
    () => [...(cities ?? [])].sort((a, b) => b.bottleCount - a.bottleCount).slice(0, 4),
    [cities]
  );
  const quietest = useMemo(
    () => [...(cities ?? [])].sort((a, b) => a.bottleCount - b.bottleCount).slice(0, 2),
    [cities]
  );

  const dive = (c: City) => {
    setSelected(null);
    router.push(`/dive/${c.id}`);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + webTop + 12,
          paddingBottom: insets.bottom + webBottom + 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>THE PLANET</Text>
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            {total.toLocaleString()} bottles adrift right now
          </Text>
        </View>

        <View style={styles.globeWrap}>
          <Globe
            cities={cities ?? []}
            drifts={drifts}
            showDrifts={showMine}
            selected={selected}
            onPickCity={setSelected}
          />
        </View>

        <View style={styles.legend}>
          <Pressable
            onPress={() => setShowMine((m) => !m)}
            style={[
              styles.legendToggle,
              {
                backgroundColor: showMine ? colors.secondary : 'transparent',
                borderColor: showMine ? colors.primary : colors.secondary,
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text
              style={[
                styles.legendText,
                { color: showMine ? colors.foreground : colors.mutedForeground },
              ]}
            >
              My bottles
            </Text>
          </Pressable>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.seaglass }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>City activity</Text>
          </View>
        </View>

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Drag to spin and tilt. Tap a city to dive in.
        </Text>

        <View style={styles.list}>
          <Rule label="Busiest waters" />
          {busiest.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => dive(c)}
              style={[styles.listRow, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.listName, { color: colors.foreground }]}>
                {c.flag} {c.name}
              </Text>
              <Text style={[styles.listCount, { color: colors.seaglass }]}>{c.bottleCount}</Text>
            </Pressable>
          ))}

          <View style={{ marginTop: 16 }}>
            <Rule label="Quiet shores" />
          </View>
          {quietest.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => dive(c)}
              style={[styles.listRow, { backgroundColor: colors.card }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.listName, { color: colors.foreground }]}>
                  {c.flag} {c.name}
                </Text>
                <Text style={[styles.listSub, { color: colors.mutedForeground }]}>
                  A bottle here won&apos;t go unnoticed
                </Text>
              </View>
              <Text style={[styles.listCount, { color: colors.mutedForeground }]}>
                {c.bottleCount}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelected(null)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 32 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.grabber, { backgroundColor: colors.mutedForeground }]} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetFlag}>{selected?.flag}</Text>
              <Text style={[styles.sheetName, { color: colors.foreground }]}>{selected?.name}</Text>
            </View>
            <Text style={[styles.sheetCount, { color: colors.seaglass }]}>
              {selected?.bottleCount} bottles adrift here
            </Text>
            <Pressable
              onPress={() => selected && dive(selected)}
              style={[styles.sheetCta, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.sheetCtaText, { color: colors.background }]}>
                Dive into {selected?.name}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, alignItems: 'center' },
  title: { fontSize: 22, fontFamily: 'PirataOne_400Regular', letterSpacing: 4 },
  subtitle: { fontSize: 12, marginTop: 3, fontFamily: 'Cinzel_400Regular' },
  globeWrap: { alignItems: 'center', marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 4 },
  legendToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11.5, fontFamily: 'Spectral_400Regular' },
  hint: { fontSize: 11, textAlign: 'center', marginTop: 8, fontFamily: 'Spectral_400Regular' },
  list: { paddingHorizontal: 20, marginTop: 16 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  listName: { fontSize: 13.5, fontFamily: 'Spectral_400Regular' },
  listSub: { fontSize: 11, marginTop: 2, fontFamily: 'Spectral_400Regular' },
  listCount: { fontSize: 12, fontFamily: 'Cinzel_400Regular' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(5,17,26,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', opacity: 0.4, marginBottom: 20 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetFlag: { fontSize: 24 },
  sheetName: { fontSize: 20, fontFamily: 'PirataOne_400Regular' },
  sheetCount: { fontSize: 13, marginTop: 4, marginBottom: 16, fontFamily: 'Cinzel_400Regular' },
  sheetCta: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  sheetCtaText: { fontSize: 15, fontFamily: 'Spectral_600SemiBold' },
});
