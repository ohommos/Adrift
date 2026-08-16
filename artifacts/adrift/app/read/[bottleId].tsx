import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { InboxItem } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { api, useBottle } from '@/lib/api';
import { showAlert } from '@/lib/alert';
import { CREDITS_PER_REPLY } from '@/lib/limits';
import { Paper, ScopeBadge, TopBar, patina, webBottom, webTop } from '@/components/ui/primitives';

export default function ReadScreen() {
  const { bottleId } = useLocalSearchParams<{ bottleId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, identity } = useIdentity();
  const queryClient = useQueryClient();
  const { data: detail } = useBottle(token, bottleId ?? '');
  const [opened, setOpened] = useState<InboxItem | null>(null);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!token || !bottleId || requested) return;
    setRequested(true);
    api
      .openBottle(token, bottleId)
      .then((item) => {
        setOpened(item);
        queryClient.invalidateQueries({ queryKey: ['inbox'] });
      })
      .catch((e: unknown) => {
        showAlert('It slipped away', e instanceof Error ? e.message : 'Could not open the bottle.');
      });
  }, [token, bottleId, requested, queryClient]);

  const credits = identity?.credits ?? 0;
  const isPro = !!identity?.isPro;
  const usedFree = !!identity?.usedFreeReply;
  const canReply = isPro || !usedFree || credits >= CREDITS_PER_REPLY;
  const replyHint = isPro
    ? 'Yours to send'
    : !usedFree
      ? 'Your first is free'
      : credits >= CREDITS_PER_REPLY
        ? 'Spends 3'
        : `${CREDITS_PER_REPLY - credits} more to go`;

  const fate = (kind: 'break' | 'pass') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/fate/${bottleId}?kind=${kind}`);
  };

  const reply = () => {
    if (!canReply) {
      showAlert(
        'No replies left',
        'You have already used your free reply. Earn three credits by breaking or passing bottles, or go Pro.'
      );
      return;
    }
    router.push(`/reply/${bottleId}`);
  };

  if (!opened) {
    return (
      <View style={[styles.root, styles.centre, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const shores = opened.passOnCount;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + webTop }}>
        <TopBar title="" onBack={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + webBottom + 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sender}>
          <Text style={styles.senderFlag}>{opened.authorFlag ?? '🐚'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.senderNick, { color: colors.foreground }]}>
              {opened.authorNickname ?? 'A stranger'}
            </Text>
            {!!opened.authorCountry && opened.authorCountry !== 'Unknown' && (
              <View style={styles.senderWhere}>
                <Feather name="map-pin" size={10} color={colors.mutedForeground} />
                <Text style={[styles.senderCountry, { color: colors.mutedForeground }]}>
                  {opened.authorCountry}
                </Text>
              </View>
            )}
          </View>
          <ScopeBadge scope={opened.scope} />
        </View>

        {shores > 1 && (
          <Text style={[styles.shores, { color: colors.mutedForeground }]}>
            Passed on {shores}x before it found you
          </Text>
        )}

        <Paper tint={patina(shores)}>
          <View style={styles.letterInner}>
            <Text style={[styles.letter, { color: colors.ink }]}>
              {opened.text ?? detail?.text ?? ''}
            </Text>
          </View>
        </Paper>

        <View style={styles.fateRow}>
          <Pressable
            onPress={() => fate('break')}
            style={[styles.fateSide, { backgroundColor: colors.card }]}
          >
            <Feather name="slash" size={19} color={colors.wax} />
            <Text style={[styles.fateSideLabel, { color: colors.mutedForeground }]}>Break</Text>
          </Pressable>

          <Pressable
            onPress={() => fate('pass')}
            style={[
              styles.fateMain,
              { backgroundColor: colors.secondary, borderColor: colors.seaglass },
            ]}
          >
            <Feather name="repeat" size={21} color={colors.seaglass} />
            <Text style={[styles.fateMainLabel, { color: colors.foreground }]}>Pass it on</Text>
            <Text style={[styles.fateMainSub, { color: colors.mutedForeground }]}>
              Sends it drifting
            </Text>
          </Pressable>

          <Pressable
            onPress={reply}
            style={[
              styles.fateSide,
              {
                backgroundColor: canReply ? colors.primary : colors.card,
                borderColor: colors.primary,
                borderWidth: canReply ? 0 : 1,
              },
            ]}
          >
            <Feather
              name={canReply ? 'send' : 'lock'}
              size={canReply ? 19 : 17}
              color={canReply ? colors.background : colors.primary}
            />
            <Text
              style={[
                styles.fateSideLabel,
                { color: canReply ? colors.background : colors.primary },
              ]}
            >
              Reply
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Break or pass it on, and you are one closer to a reply.{'\n'}
          <Text style={{ color: colors.primary }}>Reply - {replyHint}.</Text> It keeps drifting
          either way.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  sender: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  senderFlag: { fontSize: 22 },
  senderNick: { fontSize: 14, fontFamily: 'Spectral_600SemiBold' },
  senderWhere: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  senderCountry: { fontSize: 11, fontFamily: 'Spectral_400Regular' },
  shores: { fontSize: 11.5, marginBottom: 10, fontFamily: 'Cinzel_400Regular' },
  letterInner: { padding: 24 },
  letter: { fontSize: 18, lineHeight: 32, fontFamily: 'IMFellEnglish_400Regular' },
  fateRow: { flexDirection: 'row', gap: 8, marginTop: 24, alignItems: 'stretch' },
  fateSide: {
    width: 78,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fateSideLabel: { fontSize: 12, fontFamily: 'Spectral_600SemiBold' },
  fateMain: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fateMainLabel: { fontSize: 13.5, fontFamily: 'Spectral_600SemiBold' },
  fateMainSub: { fontSize: 10.5, fontFamily: 'Spectral_400Regular' },
  hint: {
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
    fontFamily: 'Spectral_400Regular',
  },
});
