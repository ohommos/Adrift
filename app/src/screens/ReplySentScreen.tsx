import React from "react";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ReplySent">;

export function ReplySentScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: C.abyss, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: C.tideLight, marginBottom: 24 }}>
        <Check size={30} color={C.seaglass} />
      </View>
      <Text style={{ fontFamily: theme.display, fontSize: 22, color: C.foam }}>Sent.</Text>
      <Text style={{ color: C.foamDim, fontSize: 13.5, marginTop: 10, textAlign: "center", lineHeight: 20 }}>
        It goes straight to them. The bottle carries on to its next shore.
      </Text>
      <Pressable
        onPress={() => navigation.navigate("Inbox")}
        style={{ marginTop: 40, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: C.tideLight }}
      >
        <Text style={{ color: C.foam, fontSize: 13.5 }}>Back to inbox</Text>
      </Pressable>
    </View>
  );
}
