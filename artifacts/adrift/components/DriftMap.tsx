import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { BottleState } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';

// react-native-svg animates its own props rather than `style`, and those must
// run on the JS driver.
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const W = 300;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function bezier(a: number, b: number, c: number, d: number, k: number) {
  const ab = lerp(a, b, k);
  const bc = lerp(b, c, k);
  const cd = lerp(c, d, k);
  return lerp(lerp(ab, bc, k), lerp(bc, cd, k), k);
}

/**
 * The bottle's course: a dashed line from where it was thrown to where it is
 * now, with the drawn portion showing progress. A drifting bottle bobs; an
 * opened one sends out a ripple; a lost one sinks below a waterline.
 */
export function DriftMap({
  progress,
  state,
  small = false,
}: {
  progress: number;
  state: BottleState;
  small?: boolean;
}) {
  const colors = useColors();
  const opened = state === 'opened';
  const lost = state === 'lost';
  const H = small ? 100 : 170;

  const p0 = { x: 18, y: H * 0.72 };
  const p1 = { x: W * 0.28, y: H * 0.18 };
  const p2 = { x: W * 0.55, y: H * 0.95 };
  const p3 = { x: W - 20, y: H * 0.34 };
  const d = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

  const t = Math.max(0.04, Math.min(progress, 0.97));
  const pt = {
    x: bezier(p0.x, p1.x, p2.x, p3.x, t),
    y: bezier(p0.y, p1.y, p2.y, p3.y, t),
  };

  // Approximate the drawn length so the solid course stops at the bottle.
  const pathLength = 420;

  const bob = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const [rippleOn, setRippleOn] = useState(false);

  useEffect(() => {
    if (opened || lost) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(bob, { toValue: 0, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opened, lost, bob]);

  useEffect(() => {
    if (!opened) return;
    setRippleOn(true);
    const loop = Animated.loop(
      Animated.timing(ripple, { toValue: 1, duration: 2400, easing: Easing.out(Easing.ease), useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [opened, ripple]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const rippleRadius = ripple.interpolate({ inputRange: [0, 1], outputRange: [6, 34] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  const bottleColor = opened ? colors.seaglass : lost ? colors.mutedForeground : colors.parchment;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Swell lines */}
        {[0.3, 0.55, 0.8].map((o, i) => (
          <Path
            key={i}
            d={`M 0 ${H * o} q ${W * 0.25} -10 ${W * 0.5} 0 t ${W * 0.5} 0`}
            fill="none"
            stroke={colors.secondary}
            strokeWidth={1}
            opacity={0.3}
          />
        ))}

        {/* Full course, then the portion already travelled */}
        <Path d={d} fill="none" stroke={colors.secondary} strokeWidth={1.5} strokeDasharray="4 5" />
        <Path
          d={d}
          fill="none"
          stroke={lost ? colors.secondary : colors.primary}
          strokeWidth={1.8}
          opacity={lost ? 0.5 : 0.85}
          strokeDasharray={`${pathLength}`}
          strokeDashoffset={pathLength * (1 - t)}
        />

        <Circle cx={p0.x} cy={p0.y} r={3} fill={colors.mutedForeground} />

        {opened && rippleOn && (
          <AnimatedCircle
            cx={pt.x}
            cy={pt.y}
            r={rippleRadius}
            opacity={rippleOpacity}
            fill="none"
            stroke={colors.seaglass}
            strokeWidth={1.5}
          />
        )}

        {lost && (
          <Path
            d={`M ${pt.x - 9} ${pt.y + 12} L ${pt.x + 9} ${pt.y + 12}`}
            stroke={colors.mutedForeground}
            strokeWidth={1}
            opacity={0.5}
          />
        )}

        <AnimatedG translateY={translateY} opacity={lost ? 0.45 : 1}>
          <Rect x={pt.x - 3} y={pt.y - 7} width={6} height={14} rx={2.5} fill={bottleColor} opacity={0.92} />
          <Rect x={pt.x - 1.5} y={pt.y - 10} width={3} height={4} rx={1} fill={colors.wax} />
        </AnimatedG>
      </Svg>
    </View>
  );
}
