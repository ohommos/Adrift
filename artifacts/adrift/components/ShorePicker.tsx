import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Shore } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';

/**
 * Pick the shore you call home. A choice rather than a guess: writing here is
 * free and it decides what drifts within reach of you, and an IP lookup is
 * not a good enough basis for either — it fails behind VPNs and mobile
 * carriers. The IP is only used to float one suggestion to the top.
 *
 * There are ~200 shores, so this searches rather than expecting a scroll.
 */
export function ShorePicker({
  shores,
  selectedId,
  onSelect,
  suggested,
  maxHeight = 300,
}: {
  shores: Shore[];
  selectedId: string | null;
  onSelect: (shore: Shore) => void;
  /** Floated to the top of an unfiltered list, labelled as a guess. */
  suggested?: Shore | null;
  maxHeight?: number;
}) {
  const colors = useColors();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...shores].sort((a, b) => a.name.localeCompare(b.name));
    if (q) {
      return sorted.filter(
        (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase() === q
      );
    }
    // No search: the guess first, then the selection, then everything else.
    const pinnedIds = new Set(
      [suggested?.id, selectedId].filter((id): id is string => !!id)
    );
    const pinned = sorted.filter((s) => pinnedIds.has(s.id));
    return [...pinned, ...sorted.filter((s) => !pinnedIds.has(s.id))];
  }, [shores, query, suggested?.id, selectedId]);

  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for your country"
          placeholderTextColor={colors.mutedForeground}
          autoCorrect={false}
          autoCapitalize="none"
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(s) => s.id}
        style={{ maxHeight }}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        initialNumToRender={12}
        windowSize={5}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            No shore by that name.
          </Text>
        }
        renderItem={({ item }) => {
          const active = item.id === selectedId;
          const isGuess = !query && !!suggested && suggested.id === item.id && !active;
          return (
            <Pressable
              onPress={() => onSelect(item)}
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
              <Text style={styles.flag}>{item.flag}</Text>
              <View style={styles.textWrap}>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                {isGuess && (
                  <Text style={[styles.guess, { color: colors.mutedForeground }]}>
                    Looks like where you are
                  </Text>
                )}
              </View>
              {active && <Feather name="check" size={17} color={colors.primary} />}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Spectral_400Regular' },
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
  guess: { fontSize: 11.5, marginTop: 1, fontFamily: 'Spectral_400Regular' },
  empty: { fontSize: 13, paddingVertical: 12, fontFamily: 'Spectral_400Regular' },
});
