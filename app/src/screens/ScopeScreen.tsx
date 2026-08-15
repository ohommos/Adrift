import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useCompose } from "../identity/ComposeContext";
import { useCreateBottle } from "../api/queries";
import { TopBar } from "../components/ui";
import { SealButton } from "../components/SealButton";
import { TabBar } from "../components/TabBar";

type Props = NativeStackScreenProps<RootStackParamList, "Scope">;

const OPTIONS: Array<{ id: "city" | "global"; label: string; desc: string }> = [
  { id: "city", label: "Your City", desc: "Only found by people near you. A smaller, closer water." },
  { id: "global", label: "Global", desc: "Could reach anyone, anywhere. You'll see which countries open it." },
];

export function ScopeScreen({ navigation }: Props) {
  const { text, scope, setScope, targetCity, setTargetCity, reset } = useCompose();
  const createBottle = useCreateBottle();
  const [sealing, setSealing] = useState(false);

  const seal = async () => {
    setSealing(true);
    try {
      await createBottle.mutateAsync({ text, scope, targetCityId: targetCity?.id });
      navigation.navigate("Sent", { scope, cityName: targetCity?.name });
      reset();
    } catch (e) {
      setSealing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }} edges={["top"]}>
      <TopBar title="Choose your ocean" onBack={() => navigation.navigate("Compose")} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        {targetCity && (
          <View style={{ borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.tide, borderWidth: 1, borderColor: C.brass }}>
            <MapPin size={15} color={C.brass} />
            <View>
              <Text style={{ color: C.foam, fontSize: 13.5 }}>Targeted at {targetCity.flag} {targetCity.name}</Text>
              <Text style={{ color: C.foamDim, fontSize: 11 }}>Chosen from the planet view</Text>
            </View>
          </View>
        )}
        {OPTIONS.map((o) => {
          const active = scope === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => {
                setScope(o.id);
                setTargetCity(null);
              }}
              style={{
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                backgroundColor: active ? C.tideLight : C.tide,
                borderWidth: 1,
                borderColor: active ? C.brass : "transparent",
              }}
            >
              <Text style={{ color: C.foam, fontFamily: theme.display, fontSize: 15, fontWeight: "600" }}>{o.label}</Text>
              <Text style={{ color: C.foamDim, fontSize: 12, marginTop: 3 }}>{o.desc}</Text>
            </Pressable>
          );
        })}
        <View style={{ borderRadius: 16, padding: 16, backgroundColor: C.tide }}>
          <Text style={{ color: C.foamDim, fontSize: 12, lineHeight: 18 }}>
            There's no telling how long it drifts, or whether anyone opens it. That's the deal.
          </Text>
        </View>
        <View style={{ marginTop: 24, marginBottom: 120, alignItems: "center" }}>
          <SealButton onDone={seal} />
        </View>
      </View>
      <TabBar active="Compose" navigation={navigation} />
    </SafeAreaView>
  );
}
