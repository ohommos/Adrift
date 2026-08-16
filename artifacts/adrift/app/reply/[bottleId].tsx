import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { api, useBottle } from '@/lib/api';
import { showAlert } from '@/lib/alert';
import { MAX_BOTTLE_LENGTH } from '@/lib/limits';
import { Paper, TopBar, webBottom, webTop } from '@/components/ui/primitives';

export default function ReplyScreen() {
  const { bottleId } = useLocalSearchParams<{ bottleId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, refreshIdentity } = useIdentity();
  const { data: bottle } = useBottle(token, bottleId ?? '');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const ready = text.trim().length >= 5;

  const send = async () => {
    if (!token || !bottleId || !ready || sending) return;
    setSending(true);
    try {
      await api.replyToBottle(token, bottleId, text.trim());
      await refreshIdentity();
      router.replace('/reply-sent');
    } catch (e: unknown) {
      showAlert('It did not send', e instanceof Error ? e.message : 'Could not send the reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + webTop }}>
        <TopBar title="Write back" onBack={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!!bottle?.text && (
          <View style={[styles.quote, { backgroundColor: colors.card }]}>
            <Text style={[styles.quoteText, { color: colors.mutedForeground }]} numberOfLines={2}>
              “{bottle.text}”
            </Text>
          </View>
        )}

        <Paper style={styles.paper}>
          <View style={styles.paperInner}>
            <TextInput
              value={text}
              onChangeText={(t) => t.length <= MAX_BOTTLE_LENGTH && setText(t)}
              placeholder="Write back to them..."
              placeholderTextColor="rgba(20,32,44,0.35)"
              multiline
              textAlignVertical="top"
              style={[styles.input, { color: colors.ink }]}
            />
            <Text style={[styles.count, { color: colors.ink }]}>
              {text.length}/{MAX_BOTTLE_LENGTH}
            </Text>
          </View>
        </Paper>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + webBottom + 24 }}>
        <Pressable
          disabled={!ready || sending}
          onPress={send}
          style={[styles.cta, { backgroundColor: ready ? colors.primary : colors.secondary }]}
        >
          {sending ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text
              style={[
                styles.ctaText,
                { color: ready ? colors.background : colors.mutedForeground },
              ]}
            >
              Send it back
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  quote: { borderRadius: 18, padding: 16, marginBottom: 16 },
  quoteText: { fontSize: 12, lineHeight: 19, fontFamily: 'Spectral_400Regular' },
  paper: { minHeight: 240 },
  paperInner: { padding: 22 },
  input: { minHeight: 176, fontSize: 18, lineHeight: 30, fontFamily: 'IMFellEnglish_400Regular' },
  count: { fontSize: 10, opacity: 0.4, textAlign: 'right', fontFamily: 'Cinzel_400Regular' },
  cta: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15, fontFamily: 'PirataOne_400Regular', letterSpacing: 0.5 },
});
