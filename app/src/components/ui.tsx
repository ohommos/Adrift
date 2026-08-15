import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { ChevronLeft } from "lucide-react-native";
import { C, theme } from "../theme/theme";
import type { BottleState } from "@adrift/shared";
import { STATE_LABEL } from "@adrift/shared";

export function TopBar({
  title,
  sub,
  onBack,
}: {
  title: string;
  sub?: string | null;
  onBack?: () => void;
}) {
  return (
    <View style={{ paddingTop: 54, paddingBottom: 8, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ width: 32 }}>
          {onBack && (
            <Pressable onPress={onBack} hitSlop={8}>
              <ChevronLeft size={22} color={C.foam} />
            </Pressable>
          )}
        </View>
        <Text
          style={{
            fontFamily: theme.display,
            fontSize: 15,
            color: C.foam,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
        <View style={{ width: 32 }} />
      </View>
      {sub ? (
        <Text style={{ color: C.foamDim, fontSize: 12, textAlign: "center", marginTop: 3 }}>{sub}</Text>
      ) : null}
    </View>
  );
}

export function Rule({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, marginTop: 4 }}>
      <Text
        style={{
          color: C.foamDim,
          fontSize: 10,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          fontFamily: theme.meta,
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.tideLight }} />
    </View>
  );
}

export function Paper({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: C.parchment,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: C.paperEdge,
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ScopeBadge({ scope }: { scope: "city" | "global" }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: C.seaglass }}>
      <Text style={{ fontSize: 10, fontFamily: theme.meta, color: C.abyss }}>
        {scope === "city" ? "City" : "Global"}
      </Text>
    </View>
  );
}

export function StateChip({ state }: { state: BottleState }) {
  const col = state === "opened" ? C.seaglass : state === "lost" ? C.foamDim : C.brass;
  return <Text style={{ fontSize: 11, color: col, fontFamily: theme.meta }}>{STATE_LABEL[state]}</Text>;
}

export function CreditPip({ credits }: { credits: number }) {
  const dots = [0, 1, 2];
  const remainder = credits % 3;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: C.tide,
      }}
    >
      {dots.map((i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i < remainder ? C.brass : C.tideLight,
          }}
        />
      ))}
      <Text style={{ fontSize: 10.5, color: C.foamDim, fontFamily: theme.meta, marginLeft: 2 }}>reply</Text>
    </View>
  );
}

export function Shores({ n }: { n: number }) {
  if (n <= 1) return null;
  return (
    <Text style={{ fontSize: 10.5, color: C.brass, fontFamily: theme.meta }}>{n} shores</Text>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: "100%",
        paddingVertical: 14,
        borderRadius: 999,
        backgroundColor: disabled ? C.tideLight : C.brass,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {icon}
      <Text style={{ color: disabled ? C.foamDim : C.abyss, fontSize: 14, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: "100%",
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: C.tide,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: C.foam, fontSize: 13.5 }}>{label}</Text>
    </Pressable>
  );
}

export function Ripple({ color, size = 80 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Circle cx={40} cy={40} r={30} stroke={color} strokeWidth={1} opacity={0.5} fill="none" />
      <Circle cx={40} cy={40} r={18} stroke={color} strokeWidth={1} opacity={0.7} fill="none" />
    </Svg>
  );
}

export const screenStyles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.abyss },
});
