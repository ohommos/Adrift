import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useCities, useCityShore } from "../api/queries";
import { useIdentity } from "../identity/IdentityContext";
import { useCompose } from "../identity/ComposeContext";
import { Paper, Rule, TopBar } from "../components/ui";
import { TabBar } from "../components/TabBar";

type Props = NativeStackScreenProps<RootStackParamList, "City">;

export function CityScreen({ route, navigation }: Props) {
  const { data: cities } = useCities();
  const city = cities?.find((c) => c.id === route.params.cityId);
  const { data: shore } = useCityShore(route.params.cityId);
  const { identity } = useIdentity();
  const { setScope, setTargetCity } = useCompose();

  if (!city) return null;

  const isHome = city.name === identity?.homeCity.name;
  const isPro = identity?.isPro ?? false;
  const canSend = isHome || isPro;
  const quiet = city.bottleCount < 20;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }} edges={["top"]}>
      <TopBar title={city.name} sub={`${city.flag}  ·  ${city.bottleCount} bottles adrift`} onBack={() => navigation.navigate("Planet")} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={{ backgroundColor: C.tideLight, borderRadius: 20, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: C.foamDim, fontSize: 12, lineHeight: 18 }}>
            {city.bottleCount > 200
              ? "Crowded water. Your bottle competes with hundreds — but someone will find it fast."
              : quiet
                ? "Barely anyone here. A bottle thrown into this water gets read carefully."
                : "Steady current. Good odds of being found within the day."}
          </Text>
        </View>

        <Rule label="Washed up here" />
        {shore?.letters.length === 0 && (
          <Text style={{ color: C.foamDim, fontSize: 12, marginBottom: 16 }}>Nothing has washed up here yet.</Text>
        )}
        {shore?.letters.map((l, i) => (
          <Paper key={i} style={{ padding: 18, marginBottom: 12 }}>
            <Text style={{ color: C.ink, fontFamily: theme.letter, fontSize: 16, lineHeight: 26 }}>{l.text}</Text>
            <Text style={{ color: C.ink, opacity: 0.45, fontSize: 10, marginTop: 10, letterSpacing: 0.5 }}>
              {l.nickname} · {l.passOnCount} shores
            </Text>
          </Paper>
        ))}
        <Text style={{ color: C.foamDim, fontSize: 11, textAlign: "center", marginBottom: 18 }}>
          A sample of what's floating here. You can't pick which one finds you.
        </Text>

        <Pressable
          onPress={() => {
            if (!canSend) return;
            setScope("city");
            setTargetCity(city);
            navigation.navigate("Compose");
          }}
          style={{
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: canSend ? C.brass : C.tideLight,
            borderWidth: canSend ? 0 : 1,
            borderColor: C.brass,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {!canSend && <Lock size={15} color={C.brass} />}
          <Text style={{ color: canSend ? C.abyss : C.brass, fontSize: 14, fontWeight: "600" }}>
            Throw a bottle into {city.name}
          </Text>
        </Pressable>
        <Text style={{ color: C.foamDim, fontSize: 11, textAlign: "center", marginTop: 9 }}>
          {isHome ? "This is your home water — always free." : isPro ? "Pro lets you send to any city." : "Sending to another city is a Pro feature."}
        </Text>
      </ScrollView>
      <TabBar active="Planet" navigation={navigation} />
    </SafeAreaView>
  );
}
