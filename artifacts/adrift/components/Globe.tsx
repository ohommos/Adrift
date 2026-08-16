import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Polyline,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import type { City } from '@adrift/shared';
import { useColors } from '@/hooks/useColors';

const LAND: Array<Array<[number, number]>> = [
  [
    [70, -160], [68, -100], [60, -64], [45, -60], [30, -82], [18, -90], [8, -78], [10, -62],
    [-5, -35], [-25, -42], [-42, -62], [-52, -70], [-32, -72], [-10, -78], [8, -80], [22, -105],
    [38, -124], [54, -132], [70, -160],
  ],
  [
    [70, 20], [62, 40], [48, 55], [38, 48], [30, 32], [12, 44], [0, 42], [-12, 38], [-30, 30],
    [-34, 20], [-20, 12], [0, 8], [12, -16], [28, -12], [36, -8], [44, -8], [58, 4], [70, 20],
  ],
  [
    [70, 60], [68, 120], [60, 160], [42, 142], [30, 122], [20, 108], [8, 98], [16, 80], [26, 68],
    [38, 58], [52, 50], [70, 60],
  ],
  [
    [-12, 132], [-24, 152], [-38, 146], [-34, 120], [-20, 116], [-12, 132],
  ],
];

function proj(la: number, lo: number, rot: number, tilt: number, R: number, cx: number, cy: number) {
  const p = (la * Math.PI) / 180;
  const l = ((lo + rot) * Math.PI) / 180;
  const t = (tilt * Math.PI) / 180;
  const x = Math.cos(p) * Math.sin(l);
  const y = Math.sin(p);
  const z = Math.cos(p) * Math.cos(l);
  const y2 = y * Math.cos(t) - z * Math.sin(t);
  const z2 = y * Math.sin(t) + z * Math.cos(t);
  return { x: cx + x * R, y: cy - y2 * R, vis: z2 > 0, z: z2 };
}

export interface DriftPin {
  id: string;
  lat: number;
  lon: number;
  opened: boolean;
}

/**
 * Draggable globe. Spins on its own, stops while you drag it, and resumes a
 * few seconds after you let go.
 */
export function Globe({
  cities,
  drifts = [],
  showDrifts = true,
  selected,
  onPickCity,
  size = 320,
  interactive = true,
  fixedRotation,
  fixedTilt,
}: {
  cities: City[];
  drifts?: DriftPin[];
  showDrifts?: boolean;
  selected?: City | null;
  onPickCity?: (city: City) => void;
  size?: number;
  interactive?: boolean;
  fixedRotation?: number;
  fixedTilt?: number;
}) {
  const colors = useColors();
  const [rot, setRot] = useState(fixedRotation ?? 0);
  const [tilt, setTilt] = useState(fixedTilt ?? 12);
  const [spinning, setSpinning] = useState(interactive);
  const [pulse, setPulse] = useState(0);
  const dragStart = useRef({ x: 0, y: 0 });
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!spinning || !interactive) return;
    const i = setInterval(() => setRot((r) => (r + 0.22) % 360), 40);
    return () => clearInterval(i);
  }, [spinning, interactive]);

  useEffect(() => {
    if (!showDrifts || drifts.length === 0) return;
    const i = setInterval(() => setPulse((v) => (v + 1) % 60), 55);
    return () => clearInterval(i);
  }, [showDrifts, drifts.length]);

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: () => interactive,
      onPanResponderGrant: (e) => {
        setSpinning(false);
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        dragStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      },
      onPanResponderMove: (e) => {
        const dx = e.nativeEvent.pageX - dragStart.current.x;
        const dy = e.nativeEvent.pageY - dragStart.current.y;
        setRot((r) => r + dx * 0.5);
        setTilt((t) => Math.max(-55, Math.min(55, t + dy * 0.28)));
        dragStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      },
      onPanResponderRelease: () => {
        resumeTimer.current = setTimeout(() => setSpinning(true), 2800);
      },
    })
  ).current;

  const R = 128 * (size / 320);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View {...(interactive ? panResponder.panHandlers : {})}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="ocean" cx="34%" cy="28%">
            <Stop offset="0%" stopColor="#1D5070" />
            <Stop offset="68%" stopColor="#0E2A3D" />
            <Stop offset="100%" stopColor="#061622" />
          </RadialGradient>
          <RadialGradient id="glowBrass">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowSea">
            <Stop offset="0%" stopColor={colors.seaglass} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={colors.seaglass} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Circle cx={cx} cy={cy} r={R + 12} stroke={colors.secondary} strokeWidth={0.5} opacity={0.3} fill="none" />
        <Circle cx={cx} cy={cy} r={R} fill="url(#ocean)" />

        {/* Parallels and meridians */}
        {[-60, -30, 0, 30, 60].map((la) => {
          const pts: string[] = [];
          for (let lo = -180; lo <= 180; lo += 5) {
            const q = proj(la, lo, rot, tilt, R, cx, cy);
            if (q.vis) pts.push(`${q.x},${q.y}`);
          }
          return <Polyline key={`la${la}`} points={pts.join(' ')} stroke={colors.secondary} strokeWidth={0.5} opacity={0.38} fill="none" />;
        })}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180].map((lo) => {
          const pts: string[] = [];
          for (let la = -85; la <= 85; la += 5) {
            const q = proj(la, lo, rot, tilt, R, cx, cy);
            if (q.vis) pts.push(`${q.x},${q.y}`);
          }
          return <Polyline key={`lo${lo}`} points={pts.join(' ')} stroke={colors.secondary} strokeWidth={0.5} opacity={0.22} fill="none" />;
        })}

        {LAND.map((poly, i) => {
          const segs: string[][] = [];
          let cur: string[] = [];
          poly.forEach(([la, lo]) => {
            const q = proj(la, lo, rot, tilt, R, cx, cy);
            if (q.vis) cur.push(`${q.x},${q.y}`);
            else if (cur.length) {
              segs.push(cur);
              cur = [];
            }
          });
          if (cur.length) segs.push(cur);
          return segs.map((s, j) => (
            <Polyline
              key={`land${i}-${j}`}
              points={s.join(' ')}
              fill="rgba(24,62,84,.6)"
              stroke={colors.secondary}
              strokeWidth={0.8}
              opacity={0.85}
            />
          ));
        })}

        {/* Your bottles, pinging where they drift */}
        {showDrifts &&
          drifts.map((d) => {
            const q = proj(d.lat, d.lon, rot, tilt, R, cx, cy);
            if (!q.vis) return null;
            const col = d.opened ? colors.seaglass : colors.primary;
            return (
              <React.Fragment key={d.id}>
                <Circle cx={q.x} cy={q.y} r={28} fill={d.opened ? 'url(#glowSea)' : 'url(#glowBrass)'} />
                <Circle
                  cx={q.x}
                  cy={q.y}
                  r={8 + pulse * 0.55}
                  fill="none"
                  stroke={col}
                  strokeWidth={1}
                  opacity={Math.max(0, 0.55 - pulse * 0.009)}
                />
                <Circle cx={q.x} cy={q.y} r={3} fill={col} />
              </React.Fragment>
            );
          })}

        {cities.map((c) => {
          const q = proj(c.lat, c.lon, rot, tilt, R, cx, cy);
          if (!q.vis) return null;
          const isSel = selected?.id === c.id;
          const r = 2 + Math.sqrt(Math.max(c.bottleCount, 1)) * 0.32;
          return (
            <React.Fragment key={c.id}>
              <Circle cx={q.x} cy={q.y} r={r + 10} fill="transparent" onPress={() => onPickCity?.(c)} />
              <Circle cx={q.x} cy={q.y} r={r} fill={colors.seaglass} opacity={0.16 + q.z * 0.28} />
              <Circle
                cx={q.x}
                cy={q.y}
                r={r * 0.42}
                fill={isSel ? colors.foreground : colors.seaglass}
                opacity={0.55 + q.z * 0.4}
              />
              {isSel && (
                <Circle cx={q.x} cy={q.y} r={r + 7} fill="none" stroke={colors.foreground} strokeWidth={1.2} />
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
