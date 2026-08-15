import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { C } from "../theme/theme";
import { useInbox } from "../api/queries";
import { ScopeBadge, Shores, TopBar } from "../components/ui";
import { TabBar } from "../components/TabBar";

type Props = NativeStackScreenProps<RootStackParamList, "Inbox">;

export function InboxScreen({ navigation }: Props) {
  const { data: inbox } = useInbox();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }} edges={["top"]}>
      <TopBar title="Inbox" sub="Bottles arrive whenever they find you." />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 120 }}>
        {inbox?.length === 0 && (
          <Text style={{ color: C.foamDim, fontSize: 13, textAlign: "center", marginTop: 24 }}>
            Nothing's washed up yet. Check back soon.
          </Text>
        )}
        {inbox?.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => navigation.navigate("Read", { bottleId: b.id })}
            style={{ backgroundColor: C.tide, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", gap: 12 }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: b.opened ? C.tideLight : C.brass,
              }}
            >
              <Text style={{ fontSize: 16 }}>{b.opened ? b.authorFlag : "🍾"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.foam, fontSize: 13.5, fontWeight: "600" }}>
                {b.opened ? b.authorNickname : "A bottle washed ashore"}
              </Text>
              <Text style={{ color: C.foamDim, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                {b.opened ? b.text : b.passOnCount > 4 ? "Weathered. Many hands before yours." : "Tap to break the seal."}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <ScopeBadge scope={b.scope} />
                <Shores n={b.passOnCount} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <TabBar active="Inbox" navigation={navigation} />
    </SafeAreaView>
  );
}
