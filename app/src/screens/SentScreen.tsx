import React from "react";
import { Pressable, Text, View } from "react-native";
import { Globe as GlobeIcon } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Sent">;

export function SentScreen({ route, navigation }: Props) {
  const { scope, cityName } = route.params;
  return (
    <View style={{ flex: 1, backgroundColor: C.abyss, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <View style={{ width: 16, height: 36, borderRadius: 8, backgroundColor: C.parchment, marginBottom: 16 }} />
      <Text style={{ fontFamily: theme.display, fontSize: 22, color: C.foam, textAlign: "center" }}>Sealed and adrift.</Text>
      <Text style={{ color: C.foamDim, fontSize: 13.5, marginTop: 10, lineHeight: 20, textAlign: "center" }}>
        {cityName ? `It's on the current toward ${cityName}.` : scope === "city" ? "It's on the current off your shore." : "It's on the global current."}
        {" "}We'll tell you if someone opens it — never who.
      </Text>
      <View style={{ marginTop: 36, gap: 8, alignItems: "center" }}>
        <Pressable onPress={() => navigation.navigate("Home")} style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: C.tideLight }}>
          <Text style={{ color: C.foam, fontSize: 13.5 }}>Track it on the tide</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Planet")} style={{ paddingHorizontal: 24, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <GlobeIcon size={14} color={C.seaglass} />
          <Text style={{ color: C.seaglass, fontSize: 13 }}>See it on the planet</Text>
        </Pressable>
      </View>
    </View>
  );
}
