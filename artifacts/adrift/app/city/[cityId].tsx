import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useCityShore } from '@/lib/api';
import { BottleCard } from '@/components/BottleCard';
import { EmptyState } from '@/components/EmptyState';

export default function CityScreen() {
  const { cityId } = useLocalSearchParams<{ cityId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useIdentity();
  const { data, isLoading } = useCityShore(token, cityId ?? '');

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { paddingTop: topPad + 12 }]}
      >
        <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>

      {isLoading || !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data.bottles}
          keyExtractor={(b) => b.id}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 40,
              flexGrow: 1,
            },
          ]}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.flag}>{data.city.flag}</Text>
              <Text style={[styles.cityName, { color: colors.primary, fontFamily: 'PirataOne_400Regular' }]}>
                {data.city.name}
              </Text>
              <Text style={[styles.country, { color: colors.mutedForeground, fontFamily: 'Cinzel_400Regular' }]}>
                {data.city.bottleCount} bottles on shore
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
            <EmptyState
              icon="anchor"
              title="The shore is quiet"
              subtitle="No bottles have washed up here yet"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20 },
  header: { marginBottom: 20, gap: 4 },
  flag: { fontSize: 40, marginBottom: 4 },
  cityName: { fontSize: 36, letterSpacing: 1 },
  country: { fontSize: 12, letterSpacing: 1 },
  divider: { height: 1, marginTop: 16, opacity: 0.4 },
});
