import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useCompose } from '@/context/ComposeContext';

const MAX_CHARS = 500;

export default function ScrawlScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { text, setText } = useCompose();

  const remaining = MAX_CHARS - text.length;
  const canSeal = text.trim().length >= 10 && text.length <= MAX_CHARS;
  const nearLimit = remaining <= 50;

  const handleSeal = () => {
    if (!canSeal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scope');
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.screenTitle, { color: colors.primary }]}>Scrawl</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Write something. No names. No dates.
        </Text>
      </View>

      {/* Parchment writing area */}
      <View style={styles.paperWrap}>
        <View style={[styles.paper, { backgroundColor: colors.parchment }]}>
          <View style={[styles.paperRule, { backgroundColor: colors.ink }]} />
          <TextInput
            style={[
              styles.letterInput,
              { color: colors.ink, fontFamily: 'IMFellEnglish_400Regular' },
            ]}
            value={text}
            onChangeText={setText}
            placeholder="Whatever you'd tell a stranger you'll never meet…"
            placeholderTextColor={`${colors.ink}55`}
            multiline
            maxLength={MAX_CHARS}
            textAlignVertical="top"
            autoCorrect
            autoCapitalize="sentences"
          />
        </View>
      </View>

      {/* Bottom controls */}
      <View
        style={[
          styles.controls,
          {
            paddingBottom: bottomPad + 90,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.counter,
            {
              color: nearLimit ? colors.wax : colors.mutedForeground,
              fontFamily: 'Cinzel_400Regular',
            },
          ]}
        >
          {remaining}
        </Text>

        <TouchableOpacity
          onPress={handleSeal}
          disabled={!canSeal}
          activeOpacity={0.8}
          style={[
            styles.sealButton,
            { backgroundColor: canSeal ? colors.primary : colors.secondary },
          ]}
        >
          <Text
            style={[
              styles.sealText,
              {
                color: canSeal ? colors.primaryForeground : colors.mutedForeground,
                fontFamily: 'PirataOne_400Regular',
              },
            ]}
          >
            Seal It
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
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
  paperWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
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
  paperRule: {
    height: 1,
    opacity: 0.15,
    marginBottom: 16,
  },
  letterInput: {
    flex: 1,
    fontSize: 20,
    lineHeight: 34,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 14,
  },
  counter: {
    fontSize: 16,
    width: 40,
    textAlign: 'center',
  },
  sealButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontSize: 22,
    letterSpacing: 1,
  },
});
