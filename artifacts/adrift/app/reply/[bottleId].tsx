import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { showAlert } from '@/lib/alert';
import { useIdentity } from '@/context/IdentityContext';
import { api } from '@/lib/api';

const MAX_CHARS = 500;

export default function ReplyScreen() {
  const { bottleId } = useLocalSearchParams<{ bottleId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, refreshIdentity } = useIdentity();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const remaining = MAX_CHARS - text.length;
  const canSend = text.trim().length >= 5 && text.length <= MAX_CHARS;
  const nearLimit = remaining <= 50;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const handleSend = async () => {
    if (!token || !bottleId || !canSend || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    try {
      await api.replyToBottle(token, bottleId, text.trim());
      await refreshIdentity();
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      router.replace('/reply-sent');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not send reply.';
      showAlert('Tide turned', msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Nav */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { paddingTop: topPad + 12 }]}
      >
        <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: colors.primary, fontFamily: 'PirataOne_400Regular' }]}>
          Your Reply
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
          They'll know someone replied — but not who you are.
        </Text>
      </View>

      {/* Parchment input */}
      <View style={styles.paperWrap}>
        <View style={[styles.paper, { backgroundColor: colors.parchment }]}>
          <TextInput
            style={[styles.input, { color: colors.ink, fontFamily: 'IMFellEnglish_400Regular' }]}
            value={text}
            onChangeText={setText}
            placeholder="Write back…"
            placeholderTextColor={`${colors.ink}55`}
            multiline
            maxLength={MAX_CHARS}
            textAlignVertical="top"
            autoCorrect
            autoCapitalize="sentences"
            autoFocus
          />
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: bottomPad + 24, borderTopColor: colors.border }]}>
        <Text
          style={[
            styles.counter,
            { color: nearLimit ? colors.wax : colors.mutedForeground, fontFamily: 'Cinzel_400Regular' },
          ]}
        >
          {remaining}
        </Text>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend || sending}
          activeOpacity={0.8}
          style={[
            styles.sendBtn,
            { backgroundColor: canSend ? colors.primary : colors.secondary },
          ]}
        >
          {sending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.sendText, { color: canSend ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'PirataOne_400Regular' }]}>
              Send Reply
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingBottom: 4 },
  titleWrap: { paddingHorizontal: 20, paddingBottom: 12, gap: 4 },
  title: { fontSize: 28, letterSpacing: 0.5 },
  sub: { fontSize: 13, lineHeight: 18 },
  paperWrap: { flex: 1, paddingHorizontal: 20, paddingBottom: 8 },
  paper: {
    flex: 1,
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  input: { flex: 1, fontSize: 20, lineHeight: 34 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  counter: { width: 40, textAlign: 'center', fontSize: 15 },
  sendBtn: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 20, letterSpacing: 0.5 },
});
