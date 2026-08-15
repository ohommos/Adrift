import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MAX_BOTTLE_LENGTH } from "@adrift/shared";
import type { InboxItem } from "@adrift/shared";
import type { RootStackParamList } from "../navigation/types";
import { C, theme } from "../theme/theme";
import { useOpenBottle, useSendReply } from "../api/queries";
import { Paper, PrimaryButton, TopBar } from "../components/ui";
import { TabBar } from "../components/TabBar";

type Props = NativeStackScreenProps<RootStackParamList, "Reply">;

export function ReplyScreen({ route, navigation }: Props) {
  const bottleId = route.params.bottleId;
  const openBottle = useOpenBottle();
  const sendReply = useSendReply();
  const [bottle, setBottle] = useState<InboxItem | null>(null);
  const [text, setText] = useState("");

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

  const send = async () => {
    await sendReply.mutateAsync({ bottleId, text });
    navigation.navigate("ReplySent");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }} edges={["top"]}>
      <TopBar title={`Reply to ${bottle.authorNickname}`} onBack={() => navigation.navigate("Read", { bottleId })} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ backgroundColor: C.tide, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: C.foamDim, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>
            "{bottle.text}"
          </Text>
        </View>
        <Paper style={{ padding: 22, minHeight: 220 }}>
          <TextInput
            value={text}
            onChangeText={(v) => v.length <= MAX_BOTTLE_LENGTH && setText(v)}
            placeholder="Write back to them..."
            placeholderTextColor="rgba(20,32,44,0.4)"
            multiline
            style={{ color: C.ink, fontFamily: theme.letter, fontSize: 18, lineHeight: 26, minHeight: 160 }}
          />
          <Text style={{ fontSize: 10, color: C.ink, opacity: 0.4, textAlign: "right" }}>
            {text.length}/{MAX_BOTTLE_LENGTH}
          </Text>
        </Paper>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 12 }}>
        <PrimaryButton label="Send it back" disabled={!text.trim()} onPress={send} />
      </View>
      <TabBar active="Inbox" navigation={navigation} />
    </SafeAreaView>
  );
}
