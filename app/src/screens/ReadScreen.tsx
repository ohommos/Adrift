import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ban, Lock, MapPin, Repeat, Send } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { InboxItem } from "@adrift/shared";
import { CREDITS_PER_REPLY } from "@adrift/shared";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useOpenBottle, useResolveFate, useUnlockPro } from "../api/queries";
import { useIdentity } from "../identity/IdentityContext";
import { Paper, ScopeBadge, TopBar } from "../components/ui";
import { TabBar } from "../components/TabBar";
import { Paywall } from "../components/Paywall";

type Props = NativeStackScreenProps<RootStackParamList, "Read">;

export function ReadScreen({ route, navigation }: Props) {
  const bottleId = route.params.bottleId;
  const openBottle = useOpenBottle();
  const resolveFate = useResolveFate();
  const unlockPro = useUnlockPro();
  const { identity, refresh } = useIdentity();
  const [bottle, setBottle] = useState<InboxItem | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    openBottle.mutateAsync(bottleId).then(setBottle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottleId]);

  if (!bottle) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.brass} />
      </SafeAreaView>
    );
  }

  const isPro = identity?.isPro ?? false;
  const usedFreeReply = identity?.usedFreeReply ?? false;
  const credits = identity?.credits ?? 0;
  const canReply = isPro || !usedFreeReply || credits >= CREDITS_PER_REPLY;
  const replyHint = isPro
    ? "Yours to send"
    : !usedFreeReply
      ? "Your first is free"
      : credits >= CREDITS_PER_REPLY
        ? "Spends 3"
        : `${CREDITS_PER_REPLY - credits} more to go`;

  const act = async (kind: "break" | "pass") => {
    await resolveFate.mutateAsync({ bottleId, kind });
    navigation.navigate("Fate", { bottleId, kind });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }} edges={["top"]}>
      <TopBar title="" onBack={() => navigation.navigate("Inbox")} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 22 }}>{bottle.authorFlag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.foam, fontSize: 14, fontWeight: "600" }}>{bottle.authorNickname}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <MapPin size={10} color={C.foamDim} />
              <Text style={{ color: C.foamDim, fontSize: 11 }}>{bottle.authorCity}</Text>
            </View>
          </View>
          <ScopeBadge scope={bottle.scope} />
        </View>
        {bottle.passOnCount > 1 && (
          <Text style={{ color: C.foamDim, fontSize: 11.5, marginBottom: 10 }}>
            Passed on {bottle.passOnCount}× before it found you
          </Text>
        )}

        <Paper style={{ padding: 24 }}>
          <Text style={{ color: C.ink, fontFamily: theme.letter, fontSize: 18, lineHeight: 29 }}>{bottle.text}</Text>
        </Paper>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 24 }}>
          <Pressable
            onPress={() => act("break")}
            style={{ width: 78, borderRadius: 16, backgroundColor: C.tide, paddingVertical: 16, alignItems: "center", gap: 6 }}
          >
            <Ban size={19} color={C.wax} />
            <Text style={{ color: C.foamDim, fontSize: 12, fontWeight: "600" }}>Break</Text>
          </Pressable>
          <Pressable
            onPress={() => act("pass")}
            style={{ flex: 1, borderRadius: 16, backgroundColor: C.tideLight, borderWidth: 1, borderColor: C.seaglass, paddingVertical: 16, alignItems: "center", gap: 6 }}
          >
            <Repeat size={21} color={C.seaglass} />
            <Text style={{ color: C.foam, fontSize: 13.5, fontWeight: "600" }}>Pass it on</Text>
            <Text style={{ color: C.foamDim, fontSize: 10.5 }}>Sends it drifting</Text>
          </Pressable>
          <Pressable
            onPress={() => (canReply ? navigation.navigate("Reply", { bottleId }) : setPaywallVisible(true))}
            style={{ width: 78, borderRadius: 16, backgroundColor: canReply ? C.brass : C.tide, borderWidth: canReply ? 0 : 1, borderColor: C.brass, paddingVertical: 16, alignItems: "center", gap: 6 }}
          >
            {canReply ? <Send size={19} color={C.abyss} /> : <Lock size={17} color={C.brass} />}
            <Text style={{ color: canReply ? C.abyss : C.brass, fontSize: 12, fontWeight: "600" }}>Reply</Text>
          </Pressable>
        </View>
        <Text style={{ color: C.foamDim, fontSize: 11.5, textAlign: "center", marginTop: 12, lineHeight: 18 }}>
          Break or pass it on, and you're one closer to a reply.{"\n"}
          <Text style={{ color: C.brass }}>Reply — {replyHint}.</Text> It keeps drifting either way.
        </Text>
      </ScrollView>
      <TabBar active="Inbox" navigation={navigation} />
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
