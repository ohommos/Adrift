import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { api } from '@/lib/api';

export default function CrewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { identity, token, refreshIdentity } = useIdentity();
  const [unlocking, setUnlocking] = useState(false);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handleUnlockPro = async () => {
    if (!token || unlocking) return;
    Alert.alert(
      'Unlock Pro',
      'Go Pro for $5 — once, forever. Unlimited replies and send to any city in the world.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: async () => {
            setUnlocking(true);
            try {
              await api.unlockPro(token);
              await refreshIdentity();
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Could not unlock Pro.';
              Alert.alert('Tide turned', msg);
            } finally {
              setUnlocking(false);
            }
          },
        },
      ]
    );
  };

  if (!identity) return null;

  const stats = [
    { icon: 'wind', label: 'Bottles cast', value: '—' },
    { icon: 'eye', label: 'Times opened', value: '—' },
    { icon: 'globe', label: 'Countries reached', value: '—' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: topPad + 16,
            paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.screenTitle, { color: colors.primary }]}>Crew</Text>

        {/* Identity card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.identityRow}>
            <View style={[styles.avatarWrap, { backgroundColor: colors.secondary }]}>
              <Text style={styles.avatarFlag}>{identity.flag}</Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={[styles.nickname, { color: colors.foreground, fontFamily: 'PirataOne_400Regular' }]}>
                {identity.nickname}
              </Text>
              <View style={styles.badgeRow}>
                {identity.isPro ? (
                  <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.proBadgeText, { color: colors.primaryForeground }]}>
                      PRO
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.freeLabel, { color: colors.mutedForeground, fontFamily: 'Cinzel_400Regular' }]}>
                    FREE CREW
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Credits */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.creditRow}>
            <Feather name="star" size={18} color={colors.primary} />
            <Text style={[styles.creditValue, { color: colors.foreground, fontFamily: 'PirataOne_400Regular' }]}>
              {identity.credits}
            </Text>
            <Text style={[styles.creditLabel, { color: colors.mutedForeground, fontFamily: 'Cinzel_400Regular' }]}>
              CREDITS
            </Text>
          </View>
          <Text style={[styles.creditHint, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
            Credits are earned when your bottle is opened. Each open grants 1 credit.
          </Text>
        </View>

        {/* Reply status */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.replyRow}>
            <Feather
              name={identity.usedFreeReply ? 'lock' : 'message-circle'}
              size={16}
              color={identity.usedFreeReply ? colors.mutedForeground : colors.seaglass}
            />
            <Text
              style={[
                styles.replyStatus,
                {
                  color: identity.usedFreeReply ? colors.mutedForeground : colors.seaglass,
                  fontFamily: 'Spectral_400Regular',
                },
              ]}
            >
              {identity.isPro
                ? 'Unlimited replies'
                : identity.usedFreeReply
                ? 'Free reply used — upgrade to reply again'
                : 'One free reply remaining'}
            </Text>
          </View>
        </View>

        {/* Pro upgrade */}
        {!identity.isPro && (
          <TouchableOpacity
            onPress={handleUnlockPro}
            activeOpacity={0.8}
            disabled={unlocking}
            style={[styles.proButton, { backgroundColor: colors.primary }]}
          >
            {unlocking ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Text style={[styles.proButtonTitle, { color: colors.primaryForeground, fontFamily: 'PirataOne_400Regular' }]}>
                  Go Pro — $5 once
                </Text>
                <Text style={[styles.proButtonSub, { color: colors.primaryForeground, fontFamily: 'Spectral_400Regular' }]}>
                  Unlimited replies · Send to any city
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  screenTitle: {
    fontSize: 34,
    fontFamily: 'PirataOne_400Regular',
    letterSpacing: 1,
    marginBottom: 6,
  },
  card: {
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFlag: { fontSize: 26 },
  identityInfo: { gap: 4 },
  nickname: { fontSize: 24 },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 11,
    fontFamily: 'Cinzel_400Regular',
    letterSpacing: 1,
  },
  freeLabel: { fontSize: 11, letterSpacing: 1 },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditValue: { fontSize: 28 },
  creditLabel: { fontSize: 12, letterSpacing: 1 },
  creditHint: { fontSize: 13, lineHeight: 19, opacity: 0.7 },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  replyStatus: { fontSize: 14 },
  proButton: {
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  proButtonTitle: { fontSize: 22 },
  proButtonSub: { fontSize: 14, opacity: 0.85 },
});
