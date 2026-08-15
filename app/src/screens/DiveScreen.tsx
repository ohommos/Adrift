import React, { useEffect } from "react";
import { Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useCities } from "../api/queries";

type Props = NativeStackScreenProps<RootStackParamList, "Dive">;

export function DiveScreen({ route, navigation }: Props) {
  const { data: cities } = useCities();
  const city = cities?.find((c) => c.id === route.params.cityId);

  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace("City", { cityId: route.params.cityId });
    }, 900);
    return () => clearTimeout(t);
  }, [navigation, route.params.cityId]);

  return (
    <View style={{ flex: 1, backgroundColor: C.abyss, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 30 }}>{city?.flag}</Text>
      <Text style={{ fontFamily: theme.display, fontSize: 22, color: C.foam, marginTop: 6 }}>{city?.name}</Text>
      <Text style={{ color: C.foamDim, fontSize: 12, marginTop: 4 }}>Approaching the shore…</Text>
    </View>
  );
}
