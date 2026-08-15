import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { City } from "@adrift/shared";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useCities, useMyBottles } from "../api/queries";
import { useIdentity } from "../identity/IdentityContext";
import { Globe } from "../components/Globe";
import { Rule, StateChip } from "../components/ui";
import { TabBar } from "../components/TabBar";
import { PrimaryButton } from "../components/ui";

type Props = NativeStackScreenProps<RootStackParamList, "Planet">;

export function PlanetScreen({ navigation }: Props) {
  const { data: cities } = useCities();
  const { data: myBottles } = useMyBottles();
  const { identity } = useIdentity();
  const [sel, setSel] = useState<City | null>(null);

  const total = cities?.reduce((a, c) => a + c.bottleCount, 0) ?? 0;
  const busiest = [...(cities ?? [])].sort((a, b) => b.bottleCount - a.bottleCount).slice(0, 4);
  const quiet = [...(cities ?? [])].sort((a, b) => a.bottleCount - b.bottleCount).slice(0, 2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }} edges={["top"]}>
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <Text style={{ fontFamily: theme.display, fontSize: 22, color: C.foam, letterSpacing: 4, textTransform: "uppercase" }}>
          The Planet
        </Text>
        <Text style={{ color: C.brass, fontSize: 12, marginTop: 3 }}>{total.toLocaleString()} bottles adrift right now</Text>
      </View>

      <View style={{ alignItems: "center", marginTop: 8 }}>
        <Globe cities={cities ?? []} homeCityName={identity?.homeCity.name} onPickCity={setSel} />
      </View>
      <Text style={{ color: C.foamDim, fontSize: 11, textAlign: "center", marginTop: 6 }}>
        Drag to spin. Tap a port to dive in.
      </Text>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {myBottles && myBottles.length > 0 && (
          <>
            <Rule label="Your bottles at sea" />
            {myBottles.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => navigation.navigate("Tracker", { bottleId: m.id, from: "Planet" })}
                style={{ backgroundColor: C.tide, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <View>
                  <Text style={{ color: C.foam, fontSize: 13.5 }}>{m.region}</Text>
                  <Text style={{ color: C.foamDim, fontSize: 11 }}>
                    {m.state === "opened" ? "Someone opened it" : "Still drifting"}
                  </Text>
                </View>
                <StateChip state={m.state} />
              </Pressable>
            ))}
          </>
        )}

        <View style={{ marginTop: 12 }}>
          <Rule label="Busiest waters" />
        </View>
        {busiest.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setSel(c)}
            style={{ backgroundColor: C.tide, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text style={{ color: C.foam, fontSize: 13.5 }}>
              {c.flag} {c.name}
            </Text>
            <Text style={{ color: C.seaglass, fontSize: 12 }}>{c.bottleCount}</Text>
          </Pressable>
        ))}

        <View style={{ marginTop: 12 }}>
          <Rule label="Quiet shores" />
        </View>
        {quiet.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setSel(c)}
            style={{ backgroundColor: C.tide, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <View>
              <Text style={{ color: C.foam, fontSize: 13.5 }}>
                {c.flag} {c.name}
              </Text>
              <Text style={{ color: C.foamDim, fontSize: 11 }}>A bottle here won't go unnoticed</Text>
            </View>
            <Text style={{ color: C.foamDim, fontSize: 12 }}>{c.bottleCount}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={!!sel} transparent animationType="slide" onRequestClose={() => setSel(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(5,17,26,0.6)", justifyContent: "flex-end" }} onPress={() => setSel(null)}>
          <Pressable style={{ backgroundColor: C.tide, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            {sel && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 24 }}>{sel.flag}</Text>
                  <Text style={{ fontFamily: theme.display, fontSize: 20, color: C.foam }}>{sel.name}</Text>
                  {sel.name === identity?.homeCity.name && (
                    <Text style={{ fontSize: 10, color: C.brass }}>HOME</Text>
                  )}
                </View>
                <Text style={{ color: C.seaglass, fontSize: 13, marginBottom: 16 }}>{sel.bottleCount} bottles adrift here</Text>
                <PrimaryButton
                  label={`Dive into ${sel.name}`}
                  onPress={() => {
                    const c = sel;
                    setSel(null);
                    navigation.navigate("Dive", { cityId: c.id });
                  }}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <TabBar active="Planet" navigation={navigation} />
    </SafeAreaView>
  );
}
