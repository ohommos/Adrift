import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { showAlert } from '@/lib/alert';
import { useIdentity } from '@/context/IdentityContext';
import { useBottle, api, type InboxItem } from '@/lib/api';
import { LetterView } from '@/components/LetterView';

export default function ReadScreen() {
  const { bottleId } = useLocalSearchParams<{ bottleId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, identity } = useIdentity();
  const queryClient = useQueryClient();
  const { data: bottle, isLoading } = useBottle(token, bottleId ?? '');
  const [opened, setOpened] = useState(false);
  const [openedBottle, setOpenedBottle] = useState<InboxItem | null>(null);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  // Auto-open on mount
  useEffect(() => {
    if (!token || !bottleId || opened) return;
    setOpened(true);
    api.openBottle(token, bottleId)
      .then((item) => {
        setOpenedBottle(item);
        queryClient.invalidateQueries({ queryKey: ['inbox'] });
      })
      .catch(() => {});
  }, [token, bottleId]);

  // The open response is the authoritative reveal; the cached detail query is
  // only a fallback for a re-visit. An inbox entry withholds its text until it
  // has been opened, so guard against that rather than rendering "null".
  const displayBottle = openedBottle ?? bottle;
  const letterText =
    (openedBottle?.text ?? bottle?.text) || 'This bottle has not been opened yet.';

  const canReply =
    !!identity && (identity.isPro || !identity.usedFreeReply);

  const handleFate = (kind: 'break' | 'pass') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/fate/${bottleId}?kind=${kind}`);
  };

  const handleReply = () => {
    if (!canReply) {
      showAlert(
        'No replies left',
        'You have already used your free reply. Upgrade to Pro for unlimited replies.'
      );
      return;
    }
    router.push(`/reply/${bottleId}`);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { paddingTop: topPad + 12 }]}
      >
        <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>

      {isLoading || !displayBottle ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          {/* Letter */}
          <LetterView
            text={letterText}
            shores={displayBottle.passOnCount}
            ocean={bottle?.region}
            scrollable
          />

          {/* Actions */}
          <View
            style={[
              styles.actions,
              {
                paddingBottom: bottomPad + 24,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleFate('break')}
              activeOpacity={0.75}
              style={[styles.actionBtn, { borderColor: colors.wax }]}
            >
              <Feather name="x" size={18} color={colors.wax} />
              <Text style={[styles.actionText, { color: colors.wax, fontFamily: 'Cinzel_400Regular' }]}>
                Break
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleFate('pass')}
              activeOpacity={0.75}
              style={[styles.actionBtn, { borderColor: colors.seaglass }]}
            >
              <Feather name="send" size={18} color={colors.seaglass} />
              <Text style={[styles.actionText, { color: colors.seaglass, fontFamily: 'Cinzel_400Regular' }]}>
                Pass
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReply}
              activeOpacity={0.75}
              style={[
                styles.actionBtn,
                { borderColor: canReply ? colors.primary : colors.border },
              ]}
            >
              <Feather name="message-circle" size={18} color={canReply ? colors.primary : colors.mutedForeground} />
              <Text
                style={[
                  styles.actionText,
                  { color: canReply ? colors.primary : colors.mutedForeground, fontFamily: 'Cinzel_400Regular' },
                ]}
              >
                Reply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actionText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
