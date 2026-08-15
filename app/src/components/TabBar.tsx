import React from "react";
import { Pressable, Text, View } from "react-native";
import { Globe, Inbox, Send, User, Waves } from "lucide-react-native";
import { C } from "../theme/theme";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";

type TabId = "Home" | "Inbox" | "Planet" | "Compose" | "Profile";

const LEFT: Array<{ id: TabId; icon: typeof Waves; label: string }> = [
  { id: "Home", icon: Waves, label: "Tide" },
  { id: "Inbox", icon: Inbox, label: "Inbox" },
];
const RIGHT: Array<{ id: TabId; icon: typeof Waves; label: string }> = [
  { id: "Compose", icon: Send, label: "Write" },
  { id: "Profile", icon: User, label: "You" },
];

export function TabBar({
  active,
  navigation,
}: {
  active: TabId;
  navigation: NavigationProp<RootStackParamList>;
}) {
  const onPlanet = active === "Planet";

  const Item = ({ id, icon: Icon, label }: { id: TabId; icon: typeof Waves; label: string }) => {
    const isActive = active === id;
    return (
      <Pressable
        onPress={() => navigation.navigate(id as never)}
        style={{ width: 62, alignItems: "center", gap: 4 }}
      >
        <Icon size={20} color={isActive ? C.brass : C.foamDim} strokeWidth={isActive ? 2.4 : 1.8} />
        <Text style={{ fontSize: 10, color: isActive ? C.brass : C.foamDim }}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 28,
        paddingTop: 12,
        backgroundColor: C.abyss,
      }}
    >
      {LEFT.map((it) => (
        <Item key={it.id} {...it} />
      ))}
      <Pressable
        onPress={() => navigation.navigate("Planet" as never)}
        style={{ width: 62, alignItems: "center", marginBottom: 2 }}
      >
        <View
          style={{
            width: 50,
            height: 50,
            marginTop: -22,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: onPlanet ? C.brass : C.tideLight,
          }}
        >
          <Globe size={24} color={onPlanet ? C.abyss : C.foam} strokeWidth={1.8} />
        </View>
        <Text style={{ fontSize: 10, color: onPlanet ? C.brass : C.foamDim, marginTop: 3 }}>Planet</Text>
      </Pressable>
      {RIGHT.map((it) => (
        <Item key={it.id} {...it} />
      ))}
    </View>
  );
}
