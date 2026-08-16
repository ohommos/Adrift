import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { MAX_BOTTLE_LENGTH } from '@/lib/limits';
import { KeyboardStickyFooter } from '@/components/KeyboardStickyFooter';
import { Paper, TopBar, webBottom, webTop } from '@/components/ui/primitives';

/** Roughly what the custom tab bar occupies above the safe area. */
const TAB_BAR_HEIGHT = 64;

/** Keep the caret this far clear of the keyboard — the footer sits in between. */
const FOOTER_CLEARANCE = 116;

/** Warn as the writer approaches the limit, before it bites. */
const WARN_AT = 0.85;

export function Composer({
  title,
  placeholder,
  value,
  onChangeText,
  onSubmit,
  submitLabel,
  submitting = false,
  onBack,
  quote,
  note,
  hasTabBar = true,
}: {
  title: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitting?: boolean;
  onBack?: () => void;
  quote?: string | null;
  note?: string;
  hasTabBar?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const used = value.length;
  const ratio = used / MAX_BOTTLE_LENGTH;
  // Any real text can be sent. There is no minimum — a short message is still
  // a message, and a hidden floor that greys out the button explains nothing.
  const ready = value.trim().length > 0;
  const atLimit = used >= MAX_BOTTLE_LENGTH;

  const counterColor = atLimit
    ? colors.wax
    : ratio >= WARN_AT
      ? colors.primary
      : colors.mutedForeground;

  const restingOffset = (hasTabBar ? TAB_BAR_HEIGHT : 0) + insets.bottom + webBottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + webTop }}>
        <TopBar title={title} onBack={onBack} />
        {focused && (
          <Pressable
            onPress={() => {
              inputRef.current?.blur();
              Keyboard.dismiss();
            }}
            style={styles.done}
            hitSlop={12}
          >
            <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
          </Pressable>
        )}
      </View>

      {/* Scrolls the caret clear of the keyboard as the letter grows. */}
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        {...(Platform.OS === 'web' ? {} : { bottomOffset: FOOTER_CLEARANCE })}
      >
        {!!quote && (
          <View style={[styles.quote, { backgroundColor: colors.card }]}>
            <Text style={[styles.quoteText, { color: colors.mutedForeground }]} numberOfLines={2}>
              “{quote}”
            </Text>
          </View>
        )}

        {/* The whole sheet is the tap target — a page you write on. */}
        <Pressable onPress={() => inputRef.current?.focus()} style={styles.paperPress}>
          <Paper style={styles.paper}>
            <View style={styles.paperInner}>
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={(t) => onChangeText(t.slice(0, MAX_BOTTLE_LENGTH))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                placeholderTextColor="rgba(20,32,44,0.35)"
                multiline
                scrollEnabled={false}
                maxLength={MAX_BOTTLE_LENGTH}
                textAlignVertical="top"
                style={[styles.input, { color: colors.ink }]}
              />
            </View>
          </Paper>
        </Pressable>

        {!!note && (
          <Text style={[styles.note, { color: colors.mutedForeground }]}>{note}</Text>
        )}
      </KeyboardAwareScrollViewCompat>

      <KeyboardStickyFooter restingOffset={restingOffset}>
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <View style={styles.meterRow}>
            <View style={[styles.meterTrack, { backgroundColor: colors.secondary }]}>
              <View
                style={[
                  styles.meterFill,
                  {
                    width: `${Math.min(ratio, 1) * 100}%`,
                    backgroundColor: counterColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.counter, { color: counterColor }]}>
              {used} / {MAX_BOTTLE_LENGTH}
            </Text>
          </View>

          <Pressable
            disabled={!ready || submitting}
            onPress={onSubmit}
            style={[
              styles.cta,
              {
                backgroundColor: ready ? colors.primary : colors.card,
                opacity: ready ? 1 : 0.55,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={ready ? colors.background : colors.mutedForeground} />
            ) : (
              <Text
                style={[
                  styles.ctaText,
                  { color: ready ? colors.background : colors.mutedForeground },
                ]}
              >
                {submitLabel}
              </Text>
            )}
          </Pressable>

          {!ready && (
            <Text style={[styles.ctaHint, { color: colors.mutedForeground }]}>
              Write something first.
            </Text>
          )}
        </View>
      </KeyboardStickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  done: { position: 'absolute', right: 20, top: 12, paddingHorizontal: 4, paddingVertical: 4 },
  doneText: { fontSize: 14, fontFamily: 'Cinzel_400Regular', letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  quote: { borderRadius: 18, padding: 16, marginBottom: 14 },
  quoteText: { fontSize: 12, lineHeight: 19, fontFamily: 'Spectral_400Regular' },
  paperPress: {},
  paper: { minHeight: 260 },
  paperInner: { padding: 22 },
  input: {
    minHeight: 216,
    fontSize: 18,
    lineHeight: 30,
    fontFamily: 'IMFellEnglish_400Regular',
    // Remove the web focus ring; the paper itself is the affordance.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  note: { fontSize: 12, textAlign: 'center', marginTop: 14, fontFamily: 'Spectral_400Regular' },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 10 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meterTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  meterFill: { height: 3, borderRadius: 2 },
  counter: { fontSize: 11.5, fontFamily: 'Cinzel_400Regular', minWidth: 66, textAlign: 'right' },
  cta: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15, fontFamily: 'Spectral_600SemiBold' },
  ctaHint: { fontSize: 11, textAlign: 'center', fontFamily: 'Spectral_400Regular' },
});
