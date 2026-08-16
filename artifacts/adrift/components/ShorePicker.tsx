import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { City } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';

/**
 * Pick the shore you call home. This is a choice rather than a guess because
 * sending here is free — an IP lookup is not a good enough basis for that,
 * and it silently fails behind VPNs and mobile carriers.
 */
export function ShorePicker({
  cities,
  selectedId,
  onSelect,
  maxHeight = 300,
}: {
  cities: City[];
  selectedId: string | null;
  onSelect: (city: City) => void;
  maxHeight?: number;
}) {
  const colors = useColors();
  const sorted = [...cities].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ScrollView
      style={{ maxHeight }}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {sorted.map((c) => {
        const active = c.id === selectedId;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c)}
            style={[
              styles.row,
              {
                backgroundColor: active ? colors.secondary : colors.card,
                borderColor: active ? colors.primary : 'transparent',
              },
            ]}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
          >
            <Text style={styles.flag}>{c.flag}</Text>
            <View style={styles.textWrap}>
              <Text style={[styles.name, { color: colors.foreground }]}>{c.name}</Text>
              <Text style={[styles.country, { color: colors.mutedForeground }]}>{c.country}</Text>
            </View>
            {active && <Feather name="check" size={17} color={colors.primary} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, paddingVertical: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  flag: { fontSize: 20 },
  textWrap: { flex: 1 },
  name: { fontSize: 14.5, fontFamily: 'Spectral_600SemiBold' },
  country: { fontSize: 11.5, marginTop: 1, fontFamily: 'Spectral_400Regular' },
});
