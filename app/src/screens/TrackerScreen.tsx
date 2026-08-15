import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useBottleDetail } from "../api/queries";
import { DriftMap } from "../components/DriftMap";
import { Paper, TopBar } from "../components/ui";
import { TabBar } from "../components/TabBar";

type Props = NativeStackScreenProps<RootStackParamList, "Tracker">;

export function TrackerScreen({ route, navigation }: Props) {
  const { data: b } = useBottleDetail(route.params.bottleId);
  if (!b) return null;

  const opened = b.state === "opened";
  const lost = b.state === "lost";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }} edges={["top"]}>
      <TopBar title="" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={{ backgroundColor: C.tideLight, borderRadius: 20, padding: 16, marginBottom: 20 }}>
          <DriftMap progress={b.progress} state={b.state} />
        </View>
        <Text
          style={{
            fontFamily: theme.display,
            fontSize: 21,
            textAlign: "center",
            color: opened ? C.seaglass : lost ? C.foamDim : C.foam,
          }}
        >
          {opened ? "Someone opened it." : lost ? "Lost at sea." : "Still drifting."}
        </Text>
        <Text style={{ color: C.foamDim, fontSize: 13.5, marginTop: 8, textAlign: "center", lineHeight: 19 }}>
          {opened
            ? "You'll never know who — unless they write back."
            : lost
              ? "It never reached anyone. Most bottles don't."
              : `Somewhere in the ${b.region}. No telling how long.`}
        </Text>

        {b.countries.length > 0 && (
          <View style={{ marginTop: 20, backgroundColor: C.tide, borderRadius: 16, padding: 16 }}>
            <Text style={{ color: C.seaglass, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Opened in
            </Text>
            {b.countries.map((c, i) => (
              <View
                key={c}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 6,
                  borderBottomWidth: i < b.countries.length - 1 ? 1 : 0,
                  borderBottomColor: "rgba(255,255,255,.06)",
                }}
              >
                <Text style={{ color: C.foam, fontSize: 13.5 }}>{c}</Text>
                <Text style={{ color: C.foamDim, fontSize: 10.5 }}>{i === 0 ? "first" : `shore ${i + 1}`}</Text>
              </View>
            ))}
          </View>
        )}

        {b.passOnCount > 1 && (
          <View style={{ marginTop: 12, backgroundColor: C.tide, borderRadius: 16, padding: 16 }}>
            <Text style={{ color: C.brass, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Passed on {b.passOnCount} times
            </Text>
            <Text style={{ color: C.foamDim, fontSize: 11.5 }}>Each reader chose to throw it back in.</Text>
          </View>
        )}

        <Paper style={{ padding: 22, marginTop: 16 }}>
          <Text style={{ color: C.ink, fontFamily: theme.letter, fontSize: 17, lineHeight: 26 }}>{b.text}</Text>
        </Paper>
      </ScrollView>
      <TabBar active={route.params.from} navigation={navigation} />
    </SafeAreaView>
  );
}
