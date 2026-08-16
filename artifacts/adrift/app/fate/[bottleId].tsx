import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { api } from '@/lib/api';
import { showAlert } from '@/lib/alert';
import { CREDITS_PER_REPLY } from '@/lib/limits';

export default function FateScreen() {
  const { bottleId, kind } = useLocalSearchParams<{ bottleId: string; kind: string }>();
  const colors = useColors();
  const { token, refreshIdentity } = useIdentity();
  const queryClient = useQueryClient();
  const broke = kind === 'break';
  const [credits, setCredits] = useState<number | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    if (!token || !bottleId || sent.current) return;
    sent.current = true;
    const call = broke ? api.breakBottle : api.passBottle;
    call(token, bottleId)
      .then(async (res) => {
        setCredits(res.credits);
        queryClient.invalidateQueries({ queryKey: ['inbox'] });
        await refreshIdentity();
      })
      .catch((e: unknown) => {
        showAlert('Tide turned', e instanceof Error ? e.message : 'Could not decide its fate.');
        router.replace('/(tabs)/haul');
      });
  }, [token, bottleId, broke, queryClient, refreshIdentity]);

  const toGo = credits === null ? null : Math.max(0, CREDITS_PER_REPLY - credits);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.icon}>
        <Feather
          name={broke ? 'slash' : 'repeat'}
          size={30}
          color={broke ? colors.wax : colors.seaglass}
        />
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>
        {broke ? 'It stops with you.' : 'Back in the water.'}
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        {broke
          ? 'Nobody is told you did this - not the sender, not anyone.'
          : 'It is drifting toward its next shore. The sender sees the count go up, not your name.'}
      </Text>

      {credits === null ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 26 }} />
      ) : (
        <>
          <View style={styles.pips}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.pip,
                  { backgroundColor: i < credits ? colors.primary : colors.secondary },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.creditNote, { color: colors.primary }]}>
            {toGo === 0 ? 'A reply is yours' : `${toGo} more for a reply`}
          </Text>
        </>
      )}

      <Pressable
        onPress={() => router.replace('/(tabs)/haul')}
        style={[styles.cta, { backgroundColor: colors.secondary }]}
      >
        <Text style={[styles.ctaText, { color: colors.foreground }]}>Back to inbox</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  icon: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 21, textAlign: 'center', fontFamily: 'PirataOne_400Regular' },
  body: {
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
    fontFamily: 'Spectral_400Regular',
  },
  pips: { flexDirection: 'row', gap: 8, marginTop: 26 },
  pip: { width: 9, height: 9, borderRadius: 5 },
  creditNote: { fontSize: 12.5, marginTop: 8, fontFamily: 'Cinzel_400Regular' },
  cta: { marginTop: 32, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 999 },
  ctaText: { fontSize: 13.5, fontFamily: 'Spectral_400Regular' },
});
