import React, { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { C } from "../theme/theme";

export function SealButton({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const begin = () => {
    timer.current = setInterval(() => {
      setP((v) => {
        const next = v + 0.028;
        if (next >= 1) {
          if (timer.current) clearInterval(timer.current);
          setTimeout(onDone, 300);
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

  const R = 43;
  const circumference = 2 * Math.PI * R;

  return (
    <View style={{ alignItems: "center" }}>
      <Pressable onPressIn={begin} onPressOut={stop}>
        <Svg width={96} height={96} viewBox="0 0 96 96">
          <Circle cx={48} cy={48} r={R} stroke={C.tideLight} strokeWidth={1} strokeDasharray="2 4" fill="none" />
          <Circle
            cx={48}
            cy={48}
            r={R}
            stroke={C.brass}
            strokeWidth={2.4}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - p)}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
          />
          <Circle cx={48} cy={48} r={27 + p * 8} fill={C.wax} opacity={0.25 + p * 0.75} />
        </Svg>
      </Pressable>
      <Text
        style={{
          color: p >= 1 ? C.brass : C.foamDim,
          fontSize: 11.5,
          marginTop: 10,
          letterSpacing: 1.6,
        }}
      >
        {p >= 1 ? "SEALED" : "HOLD TO SEAL"}
      </Text>
    </View>
  );
}
