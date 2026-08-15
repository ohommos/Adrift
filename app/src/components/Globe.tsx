import React, { useEffect, useRef, useState } from "react";
import { PanResponder, View } from "react-native";
import Svg, { Circle, Defs, Polyline, RadialGradient, Stop } from "react-native-svg";
import type { City } from "@adrift/shared";
import { C } from "../theme/theme";

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

export function Globe({
  cities,
  homeCityName,
  onPickCity,
  size = 300,
}: {
  cities: City[];
  homeCityName?: string;
  onPickCity: (city: City) => void;
  size?: number;
}) {
  const [rot, setRot] = useState(0);
  const [tilt, setTilt] = useState(12);
  const [spinning, setSpinning] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!spinning) return;
    const i = setInterval(() => setRot((r) => (r + 0.25) % 360), 40);
    return () => clearInterval(i);
  }, [spinning]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
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

  const R = 128;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View {...panResponder.panHandlers}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="ocean" cx="34%" cy="28%">
            <Stop offset="0%" stopColor="#1D5070" />
            <Stop offset="68%" stopColor="#0E2A3D" />
            <Stop offset="100%" stopColor="#061622" />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={R + 12} stroke={C.tideLight} strokeWidth={0.5} opacity={0.3} fill="none" />
        <Circle cx={cx} cy={cy} r={R} fill="url(#ocean)" />

        {[-60, -30, 0, 30, 60].map((la) => {
          const pts: string[] = [];
          for (let lo = -180; lo <= 180; lo += 6) {
            const q = proj(la, lo, rot, tilt, R, cx, cy);
            if (q.vis) pts.push(`${q.x},${q.y}`);
          }
          return <Polyline key={`la${la}`} points={pts.join(" ")} stroke={C.tideLight} strokeWidth={0.5} opacity={0.3} fill="none" />;
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
              points={s.join(" ")}
              fill="rgba(24,62,84,.6)"
              stroke={C.tideLight}
              strokeWidth={0.8}
              opacity={0.85}
            />
          ));
        })}

        {cities.map((c) => {
          const q = proj(c.lat, c.lon, rot, tilt, R, cx, cy);
          if (!q.vis) return null;
          const isHome = c.name === homeCityName;
          const r = 2 + Math.sqrt(Math.max(c.bottleCount, 1)) * 0.32;
          return (
            <React.Fragment key={c.id}>
              <Circle
                cx={q.x}
                cy={q.y}
                r={r + 8}
                fill="transparent"
                onPress={() => onPickCity(c)}
              />
              <Circle cx={q.x} cy={q.y} r={r} fill={isHome ? C.brass : C.seaglass} opacity={0.16 + q.z * 0.28} />
              <Circle
                cx={q.x}
                cy={q.y}
                r={r * 0.42}
                fill={isHome ? C.brass : C.seaglass}
                opacity={0.55 + q.z * 0.4}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
