import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_BOTTLE_LENGTH } from '@/lib/limits';
import { useColors } from '@/hooks/useColors';
import { useCompose } from '@/context/ComposeContext';
import { Paper, TopBar, webBottom, webTop } from '@/components/ui/primitives';

export default function WriteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { text, setText } = useCompose();

  const ready = text.trim().length >= 10;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + webTop }}>
        <TopBar title="Write" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Paper style={styles.paper}>
          <View style={styles.paperInner}>
            <TextInput
              value={text}
              onChangeText={(t) => t.length <= MAX_BOTTLE_LENGTH && setText(t)}
              placeholder="What do you want the sea to carry?"
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

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          Text only. No photos, no names — just what you&apos;d say to a stranger.
        </Text>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + webBottom + 110 }}>
        <Pressable
          disabled={!ready}
          onPress={() => router.push('/scope')}
          style={[
            styles.cta,
            { backgroundColor: ready ? colors.primary : colors.secondary },
          ]}
        >
          <Text
            style={[
              styles.ctaText,
              { color: ready ? colors.background : colors.mutedForeground },
            ]}
          >
            Choose an ocean
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  paper: { minHeight: 280 },
  paperInner: { padding: 24 },
  input: {
    minHeight: 200,
    fontSize: 18,
    lineHeight: 30,
    fontFamily: 'IMFellEnglish_400Regular',
  },
  count: { fontSize: 10, opacity: 0.4, textAlign: 'right', fontFamily: 'Cinzel_400Regular' },
  note: { fontSize: 12, textAlign: 'center', marginTop: 14, fontFamily: 'Spectral_400Regular' },
  cta: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15, fontFamily: 'PirataOne_400Regular', letterSpacing: 0.5 },
});
