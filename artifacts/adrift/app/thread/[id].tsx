import React from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Letter } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { useCorrespondence } from '@/lib/api';
import { Paper, TopBar, webBottom, webTop } from '@/components/ui/primitives';

function LetterSheet({ letter }: { letter: Letter }) {
  const colors = useColors();
  const crossing = !letter.arrived;
  return (
    <View style={[styles.letterWrap, letter.fromMe ? styles.fromMe : styles.fromThem]}>
      <Text style={[styles.who, { color: colors.mutedForeground }]}>
        {letter.fromMe ? 'You wrote' : 'They wrote'}
      </Text>
      <Paper style={{ opacity: crossing ? 0.5 : 1 }}>
        <View style={styles.letterInner}>
          <Text style={[styles.letterText, { color: colors.ink }]}>{letter.text}</Text>
        </View>
      </Paper>
      {crossing && (
        <View style={styles.crossingRow}>
          <Feather name="navigation" size={11} color={colors.primary} />
          <Text style={[styles.crossing, { color: colors.primary }]}>Still crossing</Text>
        </View>
      )}
    </View>
  );
}

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useIdentity();
  const { data, isLoading } = useCorrespondence(token, id ?? '');

  if (isLoading || !data) {
    return (
      <View style={[styles.root, styles.centre, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const costNote =
    data.writeCost > 0
      ? `Keeping this going costs ${data.writeCost} credits, once. After that it stays open.`
      : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + webTop }}>
        <TopBar
          title={data.withNickname}
          onBack={() => router.back()}
          sub={`${data.withFlag}  ·  from a bottle you shared`}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + webBottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* The bottle that started it sits at the head of the thread. */}
        <View style={[styles.origin, { backgroundColor: colors.card }]}>
          <Text style={[styles.originLabel, { color: colors.seaglass }]}>THE BOTTLE</Text>
          <Text style={[styles.originText, { color: colors.mutedForeground }]} numberOfLines={3}>
            “{data.bottleText}”
          </Text>
        </View>

        {data.letters.map((l) => (
          <LetterSheet key={l.id} letter={l} />
        ))}

        {data.awaitingArrival && (
          <Text style={[styles.waiting, { color: colors.mutedForeground }]}>
            Your letter is at sea. It will reach them when it reaches them.
          </Text>
        )}

        <Pressable
          onPress={() => router.push(`/write-letter/${data.id}`)}
          disabled={!data.canWrite}
          style={[
            styles.cta,
            {
              backgroundColor: data.canWrite ? colors.primary : colors.card,
              opacity: data.canWrite ? 1 : 0.55,
            },
          ]}
        >
          <Text
            style={[
              styles.ctaText,
              { color: data.canWrite ? colors.background : colors.mutedForeground },
            ]}
          >
            Write back
          </Text>
        </Pressable>

        {!!costNote && (
          <Text style={[styles.note, { color: colors.mutedForeground }]}>{costNote}</Text>
        )}
        {!data.canWrite && (
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Break or pass on a few bottles to earn the credits.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  origin: { borderRadius: 16, padding: 14, marginBottom: 18 },
  originLabel: { fontSize: 10, letterSpacing: 1.4, marginBottom: 6, fontFamily: 'Cinzel_400Regular' },
  originText: { fontSize: 12.5, lineHeight: 19, fontFamily: 'Spectral_400Regular' },
  letterWrap: { marginBottom: 18, maxWidth: '92%' },
  fromMe: { alignSelf: 'flex-end' },
  fromThem: { alignSelf: 'flex-start' },
  who: { fontSize: 10.5, letterSpacing: 1, marginBottom: 5, fontFamily: 'Cinzel_400Regular' },
  letterInner: { padding: 18 },
  letterText: { fontSize: 16, lineHeight: 27, fontFamily: 'IMFellEnglish_400Regular' },
  crossingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  crossing: { fontSize: 11, fontFamily: 'Cinzel_400Regular' },
  waiting: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
    fontFamily: 'Spectral_400Regular',
  },
  cta: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  ctaText: { fontSize: 15, fontFamily: 'Spectral_600SemiBold' },
  note: { fontSize: 11.5, textAlign: 'center', marginTop: 10, lineHeight: 17, fontFamily: 'Spectral_400Regular' },
});
