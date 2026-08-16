import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useCompose } from '@/context/ComposeContext';
import { useCities, api } from '@/lib/api';
import { showAlert } from '@/lib/alert';

export default function ScopeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, identity, refreshIdentity } = useIdentity();
  const { text, clearText } = useCompose();
  const { data: cities } = useCities(token);
  const [scope, setScope] = useState<'global' | 'city'>('global');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [casting, setCasting] = useState(false);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const canCast =
    scope === 'global' || (scope === 'city' && !!selectedCity && !!identity?.isPro);

  const handleCast = async () => {
    if (!token || !canCast || casting) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCasting(true);
    try {
      const targetCityId = scope === 'city' && selectedCity ? selectedCity : undefined;
      await api.createBottle(token, text, targetCityId);
      await refreshIdentity();
      clearText();
      router.replace('/sent');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not cast bottle.';
      showAlert('Bottle sank', msg);
    } finally {
      setCasting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back + title */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
          <Text style={[styles.backText, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
            Back to scrawl
          </Text>
        </TouchableOpacity>

        <Text style={[styles.screenTitle, { color: colors.primary }]}>Where?</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
          Choose where your bottle drifts to
        </Text>

        {/* Global option */}
        <TouchableOpacity
          onPress={() => { setScope('global'); setSelectedCity(null); }}
          activeOpacity={0.75}
          style={[
            styles.option,
            {
              backgroundColor: colors.card,
              borderColor: scope === 'global' ? colors.primary : colors.border,
              borderWidth: scope === 'global' ? 2 : 1,
            },
          ]}
        >
          <View style={styles.optionIcon}>
            <Feather name="globe" size={22} color={scope === 'global' ? colors.primary : colors.mutedForeground} />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.foreground, fontFamily: 'PirataOne_400Regular' }]}>
              Global Ocean
            </Text>
            <Text style={[styles.optionSub, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
              Drift anywhere — any coast, any soul
            </Text>
          </View>
          {scope === 'global' && (
            <Feather name="check-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* City option */}
        <TouchableOpacity
          onPress={() => {
            if (!identity?.isPro) {
              showAlert(
                'Pro required',
                'Targeting a specific city requires a Pro account. Upgrade for $5, once, forever.'
              );
              return;
            }
            setScope('city');
          }}
          activeOpacity={0.75}
          style={[
            styles.option,
            {
              backgroundColor: colors.card,
              borderColor: scope === 'city' ? colors.primary : colors.border,
              borderWidth: scope === 'city' ? 2 : 1,
              opacity: identity?.isPro ? 1 : 0.6,
            },
          ]}
        >
          <View style={styles.optionIcon}>
            <Feather name="anchor" size={22} color={scope === 'city' ? colors.primary : colors.mutedForeground} />
          </View>
          <View style={styles.optionText}>
            <View style={styles.optionTitleRow}>
              <Text style={[styles.optionTitle, { color: colors.foreground, fontFamily: 'PirataOne_400Regular' }]}>
                A Specific Port
              </Text>
              {!identity?.isPro && (
                <View style={[styles.proBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.proBadgeText, { color: colors.mutedForeground }]}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={[styles.optionSub, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
              Send your bottle straight to a chosen city
            </Text>
          </View>
          {scope === 'city' && selectedCity && (
            <Feather name="check-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* City picker */}
        {scope === 'city' && identity?.isPro && (
          <View style={styles.cityGrid}>
            {cities?.map((city) => (
              <TouchableOpacity
                key={city.id}
                onPress={() => setSelectedCity(city.id)}
                activeOpacity={0.75}
                style={[
                  styles.cityChip,
                  {
                    backgroundColor: selectedCity === city.id ? colors.primary : colors.card,
                    borderColor: selectedCity === city.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={styles.cityFlag}>{city.flag}</Text>
                <Text
                  style={[
                    styles.cityName,
                    {
                      color: selectedCity === city.id ? colors.primaryForeground : colors.foreground,
                      fontFamily: 'Cinzel_400Regular',
                    },
                  ]}
                >
                  {city.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Cast button */}
        <TouchableOpacity
          onPress={handleCast}
          disabled={!canCast || casting}
          activeOpacity={0.8}
          style={[
            styles.castButton,
            { backgroundColor: canCast ? colors.primary : colors.secondary },
          ]}
        >
          {casting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.castText, { color: canCast ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'PirataOne_400Regular' }]}>
              Cast Into the Sea
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  backText: { fontSize: 14 },
  screenTitle: {
    fontSize: 34,
    fontFamily: 'PirataOne_400Regular',
    letterSpacing: 1,
  },
  sub: { fontSize: 14, marginTop: -8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    padding: 16,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: 4 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionTitle: { fontSize: 20 },
  optionSub: { fontSize: 13, lineHeight: 18 },
  proBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 9,
    fontFamily: 'Cinzel_400Regular',
    letterSpacing: 1,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  cityFlag: { fontSize: 16 },
  cityName: { fontSize: 13 },
  castButton: {
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  castText: { fontSize: 24, letterSpacing: 0.5 },
});
