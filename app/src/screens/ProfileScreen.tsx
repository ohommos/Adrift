import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, Unlock } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CREDITS_PER_REPLY, PRO_PRICE_USD } from "@adrift/shared";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useIdentity } from "../identity/IdentityContext";
import { useMyBottles, useUnlockPro } from "../api/queries";
import { PrimaryButton, Rule, TopBar } from "../components/ui";
import { TabBar } from "../components/TabBar";
import { Paywall } from "../components/Paywall";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export function ProfileScreen({ navigation }: Props) {
  const { identity, refresh } = useIdentity();
  const { data: myBottles } = useMyBottles();
  const unlockPro = useUnlockPro();
  const [paywallVisible, setPaywallVisible] = useState(false);

  if (!identity) return null;

  const thrown = myBottles?.length ?? 0;
  const opened = myBottles?.filter((b) => b.countries.length > 0 || b.state === "opened" || b.state === "lost").length ?? 0;
  const shores = myBottles?.reduce((a, b) => a + b.passOnCount, 0) ?? 0;
  const remainder = identity.credits % CREDITS_PER_REPLY;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }} edges={["top"]}>
      <TopBar title="You" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: C.tideLight, marginBottom: 12 }}>
            <Text style={{ fontSize: 30 }}>🐚</Text>
          </View>
          <Text style={{ color: C.foam, fontFamily: theme.display, fontSize: 18, fontWeight: "600" }}>{identity.nickname}</Text>
          <Text style={{ color: C.foamDim, fontSize: 12, marginTop: 2 }}>
            {identity.flag} {identity.homeCity.name}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-around", backgroundColor: C.tide, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          {[
            [thrown, "Thrown"],
            [opened, "Found"],
            [shores, "Shores reached"],
          ].map(([n, l]) => (
            <View key={l as string} style={{ alignItems: "center" }}>
              <Text style={{ color: C.foam, fontSize: 18, fontWeight: "700" }}>{n}</Text>
              <Text style={{ color: C.foamDim, fontSize: 11 }}>{l}</Text>
            </View>
          ))}
        </View>

        {!identity.isPro && (
          <View style={{ backgroundColor: C.tide, borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <Rule label="Toward your next reply" />
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < remainder ? C.brass : C.tideLight }} />
              ))}
            </View>
            <Text style={{ color: C.foamDim, fontSize: 12 }}>
              {!identity.usedFreeReply
                ? "Your first reply is free — it's waiting for you."
                : remainder === 0 && identity.credits > 0
                  ? "You've earned a reply."
                  : `${CREDITS_PER_REPLY - remainder} more bottles passed on or broken.`}
            </Text>
          </View>
        )}

        <View style={{ backgroundColor: identity.isPro ? C.tide : C.tideLight, borderRadius: 16, padding: 16, borderWidth: identity.isPro ? 0 : 1, borderColor: C.brass }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {identity.isPro ? <Unlock size={15} color={C.seaglass} /> : <Lock size={15} color={C.brass} />}
            <Text style={{ color: C.foam, fontSize: 13.5, fontWeight: "600" }}>{identity.isPro ? "Adrift Pro active" : "Adrift Pro"}</Text>
          </View>
          <Text style={{ color: C.foamDim, fontSize: 12, marginBottom: identity.isPro ? 0 : 10 }}>
            {identity.isPro ? "Unlimited replies and any city on the planet." : "Skip the three pass-ons. Reply to anyone, any time."}
          </Text>
          {!identity.isPro && (
            <View style={{ marginTop: 4 }}>
              <PrimaryButton label={`Unlock for $${PRO_PRICE_USD}`} onPress={() => setPaywallVisible(true)} />
            </View>
          )}
        </View>
      </ScrollView>
      <TabBar active="Profile" navigation={navigation} />
      <Paywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onUnlock={async () => {
          await unlockPro.mutateAsync();
          await refresh();
          setPaywallVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
