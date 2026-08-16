import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { InboxItem } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useInbox } from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';
import {
  ScopeBadge,
  Shores,
  TopBar,
  patina,
  webBottom,
  webTop,
} from '@/components/ui/primitives';

/** "just now" / "3h" / "yesterday" — the design's relative stamp. */
function since(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days}d`;
}

function InboxRow({ item, onPress }: { item: InboxItem; onPress: () => void }) {
  const colors = useColors();
  const aged = patina(item.passOnCount);

  return (
    <Pressable onPress={onPress} style={[styles.row, { backgroundColor: colors.card }]}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: item.opened ? colors.secondary : colors.primary },
        ]}
      >
        <Text style={styles.avatarGlyph}>{item.opened ? (item.authorFlag ?? '🐚') : '🍾'}</Text>
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowHead}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.opened ? (item.authorNickname ?? 'A stranger') : 'A bottle washed ashore'}
          </Text>
          <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>
            {since(item.createdAt)}
          </Text>
        </View>

        <Text style={[styles.rowPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.opened
            ? item.text
            : aged > 0.5
              ? 'Weathered. Many hands before yours.'
              : 'Tap to break the seal.'}
        </Text>

        <View style={styles.rowMeta}>
          <ScopeBadge scope={item.scope} />
          <Shores n={item.passOnCount} />
        </View>
      </View>
    </Pressable>
  );
}

export default function InboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useIdentity();
  const { data: bottles, isLoading, refetch, isRefetching } = useInbox(token);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + webTop }}>
        <TopBar title="Inbox" sub="Bottles arrive whenever they find you." />
      </View>

      <FlatList
        data={bottles ?? []}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + webBottom + 140,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <InboxRow item={item} onPress={() => router.push(`/read/${item.id}`)} />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="inbox"
              title="The shore is empty"
              subtitle="Bottles from strangers will appear here as they drift to you"
            />
          )
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarGlyph: { fontSize: 16 },
  rowBody: { flex: 1, minWidth: 0 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowTitle: { flex: 1, fontSize: 13.5, fontFamily: 'Spectral_600SemiBold' },
  rowTime: { fontSize: 10.5, fontFamily: 'Cinzel_400Regular' },
  rowPreview: { fontSize: 12, marginTop: 3, fontFamily: 'Spectral_400Regular' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
});
