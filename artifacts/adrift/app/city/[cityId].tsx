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
          data={data.letters}
          keyExtractor={(l, i) => `${l.nickname}-${i}`}
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
            // A shore shows sample letters washed up here, not bottles you can
            // claim — the server sends no id and opening is done from the Haul.
            <View style={[styles.letter, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.letterHead}>
                <Text style={[styles.letterFrom, { color: colors.primary, fontFamily: 'Cinzel_400Regular' }]}>
                  {item.nickname}
                </Text>
                <Text style={[styles.letterShores, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
                  {item.passOnCount} {item.passOnCount === 1 ? 'shore' : 'shores'}
                </Text>
              </View>
              <Text
                style={[styles.letterBody, { color: colors.foreground, fontFamily: 'Spectral_400Regular' }]}
                numberOfLines={4}
              >
                {item.text}
              </Text>
            </View>
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
  letter: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  letterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  letterFrom: { fontSize: 13, letterSpacing: 1 },
  letterShores: { fontSize: 12, opacity: 0.8 },
  letterBody: { fontSize: 15, lineHeight: 22 },
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
