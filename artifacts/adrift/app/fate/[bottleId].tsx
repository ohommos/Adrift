import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useIdentity } from '@/context/IdentityContext';
import { api } from '@/lib/api';

export default function FateScreen() {
  const { bottleId, kind } = useLocalSearchParams<{ bottleId: string; kind: 'break' | 'pass' }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useIdentity();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isBreak = kind === 'break';
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const handleConfirm = async () => {
    if (!token || !bottleId || loading) return;
    Haptics.impactAsync(isBreak ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      if (isBreak) {
        await api.breakBottle(token, bottleId);
      } else {
        await api.passBottle(token, bottleId);
      }
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      setDone(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      Alert.alert('Tide turned', msg);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
        <Text style={[styles.doneEmoji]}>
          {isBreak ? '💔' : '🌊'}
        </Text>
        <Text style={[styles.doneTitle, { color: isBreak ? colors.wax : colors.seaglass, fontFamily: 'PirataOne_400Regular' }]}>
          {isBreak ? 'Broken' : 'Passed On'}
        </Text>
        <Text style={[styles.doneSub, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
          {isBreak
            ? 'The bottle sinks. Its message fades with the tide.'
            : 'The bottle drifts on. Another shore awaits.'}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/haul')}
          activeOpacity={0.8}
          style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.buttonText, { color: colors.foreground, fontFamily: 'PirataOne_400Regular' }]}>
            Back to Haul
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={[styles.icon]}>
          {isBreak ? '💔' : '🌊'}
        </Text>

        <Text style={[styles.title, { color: isBreak ? colors.wax : colors.seaglass, fontFamily: 'PirataOne_400Regular' }]}>
          {isBreak ? 'Break It' : 'Pass It On'}
        </Text>

        <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
          {isBreak
            ? "The message will be lost. The sender will know only that their bottle was broken — nothing more."
            : "The bottle continues its drift. Another stranger will find it on a different shore."}
        </Text>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
          style={[
            styles.confirmBtn,
            { backgroundColor: isBreak ? colors.wax : colors.seaglass },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.confirmText, { color: 'white', fontFamily: 'PirataOne_400Regular' }]}>
              {isBreak ? 'Break the Bottle' : 'Set It Adrift'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <Text style={[styles.cancelText, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingBottom: 8 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  icon: { fontSize: 72 },
  title: { fontSize: 38, letterSpacing: 1, textAlign: 'center' },
  desc: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  confirmBtn: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontSize: 22, letterSpacing: 0.5 },
  cancelText: { fontSize: 15, marginTop: 4 },
  doneEmoji: { fontSize: 80, textAlign: 'center' },
  doneTitle: { fontSize: 40, letterSpacing: 1, textAlign: 'center' },
  doneSub: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  button: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  buttonText: { fontSize: 20 },
});
