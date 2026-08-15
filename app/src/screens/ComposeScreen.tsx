import React from "react";
import { Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MAX_BOTTLE_LENGTH } from "@adrift/shared";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useCompose } from "../identity/ComposeContext";
import { Paper, PrimaryButton, TopBar } from "../components/ui";
import { TabBar } from "../components/TabBar";

type Props = NativeStackScreenProps<RootStackParamList, "Compose">;

export function ComposeScreen({ navigation }: Props) {
  const { text, setText, targetCity } = useCompose();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }} edges={["top"]}>
      <TopBar
        title="Write"
        sub={targetCity ? `Bound for ${targetCity.flag} ${targetCity.name}` : null}
        onBack={() => navigation.navigate("Home")}
      />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        <Paper style={{ padding: 22, minHeight: 260 }}>
          <TextInput
            value={text}
            onChangeText={(v) => v.length <= MAX_BOTTLE_LENGTH && setText(v)}
            placeholder="What do you want the sea to carry?"
            placeholderTextColor="rgba(20,32,44,0.4)"
            multiline
            style={{ color: C.ink, fontFamily: theme.letter, fontSize: 18, lineHeight: 26, minHeight: 200 }}
          />
          <Text style={{ fontSize: 10, color: C.ink, opacity: 0.4, textAlign: "right" }}>
            {text.length}/{MAX_BOTTLE_LENGTH}
          </Text>
        </Paper>
        <Text style={{ color: C.foamDim, fontSize: 12, marginTop: 14, textAlign: "center" }}>
          Text only. No photos, no names — just what you'd say to a stranger.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <PrimaryButton label="Choose an ocean" disabled={!text.trim()} onPress={() => navigation.navigate("Scope")} />
      </View>
      <TabBar active="Compose" navigation={navigation} />
    </SafeAreaView>
  );
}
