import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { BottleState } from "@adrift/shared";
import { C } from "../theme/theme";

// A simplified, static rendering of the prototype's animated drift path:
// a dashed course from origin to the bottle's current point along the way,
// with a marker sitting at the bottle's current progress.
export function DriftMap({
  progress,
  state,
  height = 140,
}: {
  progress: number;
  state: BottleState;
  height?: number;
}) {
  const opened = state === "opened";
  const lost = state === "lost";
  const W = 300;
  const H = height;
  const d = `M 18 ${H * 0.72} C ${W * 0.28} ${H * 0.18}, ${W * 0.55} ${H * 0.95}, ${W - 20} ${H * 0.34}`;
  const t = Math.max(0.04, Math.min(progress, 0.97));
  // Rough point-on-curve approximation (cubic bezier) matching the path above.
  const p0 = { x: 18, y: H * 0.72 };
  const p1 = { x: W * 0.28, y: H * 0.18 };
  const p2 = { x: W * 0.55, y: H * 0.95 };
  const p3 = { x: W - 20, y: H * 0.34 };
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  const bez = (a: number, b: number, c: number, dd: number, k: number) => {
    const ab = lerp(a, b, k);
    const bc = lerp(b, c, k);
    const cd = lerp(c, dd, k);
    const abbc = lerp(ab, bc, k);
    const bccd = lerp(bc, cd, k);
    return lerp(abbc, bccd, k);
  };
  const pt = {
    x: bez(p0.x, p1.x, p2.x, p3.x, t),
    y: bez(p0.y, p1.y, p2.y, p3.y, t),
  };
  const col = opened ? C.seaglass : lost ? C.foamDim : C.parchment;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Path d={d} stroke={C.tideLight} strokeWidth={1.5} strokeDasharray="4 5" fill="none" />
        <Path
          d={d}
          stroke={lost ? C.tideLight : C.brass}
          strokeWidth={1.8}
          fill="none"
          opacity={lost ? 0.5 : 0.8}
        />
        <Circle cx={18} cy={H * 0.72} r={3} fill={C.foamDim} />
        {opened && <Circle cx={pt.x} cy={pt.y} r={14} stroke={C.seaglass} strokeWidth={1.5} fill="none" opacity={0.6} />}
        {lost && (
          <Path
            d={`M ${pt.x - 9} ${pt.y + 12} L ${pt.x + 9} ${pt.y + 12}`}
            stroke={C.foamDim}
            strokeWidth={1}
            opacity={0.5}
          />
        )}
        <Circle cx={pt.x} cy={pt.y} r={4} fill={col} opacity={lost ? 0.45 : 1} />
        <Circle cx={pt.x} cy={pt.y - 4} r={1.6} fill={C.wax} opacity={lost ? 0.45 : 1} />
      </Svg>
    </View>
  );
}
