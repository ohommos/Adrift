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
import { useInbox } from '@/lib/api';
import { BottleCard } from '@/components/BottleCard';
import { EmptyState } from '@/components/EmptyState';

export default function HaulScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useIdentity();
  const { data: bottles, isLoading, refetch, isFetching } = useInbox(token);

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
            <Text style={[styles.screenTitle, { color: colors.primary }]}>Haul</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {bottles?.length ?? 0} bottles washed ashore
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BottleCard
            bottle={item}
            mode="inbox"
            onPress={() => router.push(`/read/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="inbox"
              title="The shore is empty"
              subtitle="Bottles from strangers will appear here as they drift to your shore"
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
