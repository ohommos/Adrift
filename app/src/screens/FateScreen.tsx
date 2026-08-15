import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ban, Repeat } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CREDITS_PER_REPLY } from "@adrift/shared";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useIdentity } from "../identity/IdentityContext";

type Props = NativeStackScreenProps<RootStackParamList, "Fate">;

export function FateScreen({ route, navigation }: Props) {
  const broke = route.params.kind === "break";
  const { identity } = useIdentity();
  const credits = identity?.credits ?? 0;
  const remainder = credits % CREDITS_PER_REPLY;

  return (
    <View style={{ flex: 1, backgroundColor: C.abyss, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <View style={{ width: 128, height: 128, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        {broke ? <Ban size={30} color={C.wax} /> : <Repeat size={30} color={C.seaglass} />}
      </View>
      <Text style={{ fontFamily: theme.display, fontSize: 21, color: C.foam, textAlign: "center" }}>
        {broke ? "It stops with you." : "Back in the water."}
      </Text>
      <Text style={{ color: C.foamDim, fontSize: 13.5, marginTop: 10, textAlign: "center", lineHeight: 20 }}>
        {broke
          ? "Nobody is told you did this — not the sender, not anyone."
          : "It's drifting toward its next shore. The sender sees the count go up, not your name."}
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 24 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: i < remainder ? C.brass : C.tideLight }} />
        ))}
      </View>
      <Text style={{ color: C.brass, fontSize: 12.5, marginTop: 8 }}>
        {remainder === 0 && credits > 0 ? "A reply is yours" : `${CREDITS_PER_REPLY - remainder} more for a reply`}
      </Text>
      <Pressable
        onPress={() => navigation.navigate("Inbox")}
        style={{ marginTop: 32, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: C.tideLight }}
      >
        <Text style={{ color: C.foam, fontSize: 13.5 }}>Back to inbox</Text>
      </Pressable>
    </View>
  );
}
