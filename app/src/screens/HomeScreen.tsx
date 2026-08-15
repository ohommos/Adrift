import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Globe as GlobeIcon, Send } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useMyBottles } from "../api/queries";
import { useIdentity } from "../identity/IdentityContext";
import { CreditPip, Rule, ScopeBadge, StateChip, Shores } from "../components/ui";
import { DriftMap } from "../components/DriftMap";
import { TabBar } from "../components/TabBar";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { data: bottles } = useMyBottles();
  const { identity } = useIdentity();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View>
          <Text style={{ fontFamily: theme.display, fontSize: 26, color: C.foam, letterSpacing: 6, textTransform: "uppercase" }}>
            Adrift
          </Text>
          <Text style={{ color: C.foamDim, fontSize: 13, fontStyle: "italic", marginTop: 2 }}>
            The water never stops moving.
          </Text>
        </View>
        <CreditPip credits={identity?.credits ?? 0} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Rule label="Your bottles" />
        {bottles?.length === 0 && (
          <Text style={{ color: C.foamDim, fontSize: 13, marginBottom: 16 }}>
            Nothing sealed yet. Throw your first bottle and see where it goes.
          </Text>
        )}
        {bottles?.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => navigation.navigate("Tracker", { bottleId: b.id, from: "Home" })}
            style={{
              backgroundColor: C.tide,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              opacity: b.state === "lost" ? 0.6 : 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ScopeBadge scope={b.scope} />
                <Shores n={b.passOnCount} />
              </View>
              <StateChip state={b.state} />
            </View>
            <DriftMap progress={b.progress} state={b.state} height={90} />
            <Text style={{ color: C.foamDim, fontSize: 11, marginBottom: 6, marginTop: 6 }}>
              {b.state === "lost" ? "Never found" : b.region}
              {b.countries.length ? ` · opened in ${b.countries.length} ${b.countries.length === 1 ? "country" : "countries"}` : ""}
            </Text>
            <Text style={{ color: C.foam, fontSize: 13, lineHeight: 19, fontFamily: theme.display }} numberOfLines={2}>
              "{b.text}"
            </Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => navigation.navigate("Compose")}
          style={{ paddingVertical: 14, borderRadius: 999, backgroundColor: C.brass, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
        >
          <Send size={15} color={C.abyss} />
          <Text style={{ color: C.abyss, fontSize: 14, fontWeight: "600" }}>Throw a bottle</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("Planet")}
          style={{ paddingVertical: 12, borderRadius: 999, backgroundColor: C.tide, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}
        >
          <GlobeIcon size={14} color={C.seaglass} />
          <Text style={{ color: C.seaglass, fontSize: 13 }}>See them on the planet</Text>
        </Pressable>
      </ScrollView>
      <TabBar active="Home" navigation={navigation} />
    </SafeAreaView>
  );
}
