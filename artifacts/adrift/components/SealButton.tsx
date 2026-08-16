import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

const R = 43;
const CIRC = 2 * Math.PI * R;

/**
 * Hold to seal. The ring fills while pressed, the wax swells, and letting go
 * early resets it — sending a bottle should take a deliberate moment.
 */
export function SealButton({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const done = useRef(false);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const begin = () => {
    if (done.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    timer.current = setInterval(() => {
      setP((v) => {
        const next = v + 0.028;
        if (next >= 1) {
          if (timer.current) clearInterval(timer.current);
          if (!done.current) {
            done.current = true;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(onDone, 380);
          }
          return 1;
        }
        return next;
      });
    }, 16);
  };

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    setP((v) => (v >= 1 ? v : 0));
  };

  const colors = useColors();
  const sealed = p >= 1;

  return (
    <View style={styles.wrap}>
      <Pressable onPressIn={begin} onPressOut={stop} accessibilityLabel="Hold to seal">
        <Svg width={96} height={96} viewBox="0 0 96 96">
          <Circle cx={48} cy={48} r={R} stroke={colors.secondary} strokeWidth={1} strokeDasharray="2 4" fill="none" />
          <Circle
            cx={48}
            cy={48}
            r={R}
            stroke={colors.primary}
            strokeWidth={2.4}
            fill="none"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={CIRC * (1 - p)}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
          />
          <Circle cx={48} cy={48} r={27 + p * 8} fill={colors.wax} opacity={0.25 + p * 0.75} />
          <Circle cx={48} cy={48} r={24} fill="none" stroke="rgba(0,0,0,.28)" strokeWidth={1} opacity={p} />
          <Path
            d="M48 37 v8 M48 45 c-5 0 -8 3 -8 7 0 5 4 8 8 8 s8 -3 8 -8 c0 -4 -3 -7 -8 -7 z"
            fill="none"
            stroke="rgba(255,255,255,.55)"
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={p}
          />
        </Svg>
      </Pressable>
      <Text style={[styles.label, { color: sealed ? colors.primary : colors.mutedForeground }]}>
        {sealed ? 'SEALED' : 'HOLD TO SEAL'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  label: {
    fontSize: 11.5,
    marginTop: 10,
    letterSpacing: 1.6,
    fontFamily: 'Cinzel_400Regular',
  },
});
