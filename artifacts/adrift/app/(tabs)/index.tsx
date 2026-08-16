import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useMyBottles } from '@/lib/api';
import { BottleCard } from '@/components/BottleCard';
import { EmptyState } from '@/components/EmptyState';

export default function TidesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, identity } = useIdentity();
  const { data: bottles, isLoading, refetch, isFetching } = useMyBottles(token);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={bottles ?? []}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: topPad + 16, flexGrow: 1 },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.screenTitle, { color: colors.primary }]}>Tides</Text>
            {identity && (
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                {identity.nickname} · {bottles?.length ?? 0} bottles cast
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <BottleCard
            bottle={item}
            mode="mine"
            onPress={() => router.push(`/tracker/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="wind"
              title="Nothing adrift yet"
              subtitle="Scrawl your first message and cast it into the ocean"
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { marginBottom: 20 },
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
});
