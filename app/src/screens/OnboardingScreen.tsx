import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { City } from "@adrift/shared";
import { C, theme } from "../theme/theme";
import { useCities } from "../api/queries";
import { useIdentity } from "../identity/IdentityContext";
import { PrimaryButton } from "../components/ui";

export function OnboardingScreen() {
  const { data: cities, isLoading } = useCities();
  const { createIdentity } = useIdentity();
  const [nickname, setNickname] = useState("");
  const [homeCity, setHomeCity] = useState<City | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = nickname.trim().length >= 2 && !!homeCity && !submitting;

  const submit = async () => {
    if (!canSubmit || !homeCity) return;
    setSubmitting(true);
    try {
      await createIdentity({ nickname: nickname.trim(), flag: homeCity.flag, homeCityId: homeCity.id });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.abyss }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
        <Text
          style={{
            fontFamily: theme.display,
            fontSize: 28,
            color: C.foam,
            letterSpacing: 6,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          Adrift
        </Text>
        <Text style={{ color: C.foamDim, fontSize: 13, textAlign: "center", marginTop: 6, fontStyle: "italic" }}>
          The water never stops moving.
        </Text>

        <Text style={{ color: C.foamDim, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginTop: 40, marginBottom: 8 }}>
          What should strangers call you?
        </Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="a nickname, not your name"
          placeholderTextColor={C.foamDim}
          maxLength={24}
          style={{
            backgroundColor: C.tide,
            color: C.foam,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 15,
          }}
        />

        <Text style={{ color: C.foamDim, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginTop: 28, marginBottom: 8 }}>
          Your home shore
        </Text>
        {isLoading ? (
          <ActivityIndicator color={C.brass} />
        ) : (
          <View style={{ gap: 8 }}>
            {cities?.map((c) => {
              const active = homeCity?.id === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setHomeCity(c)}
                  style={{
                    borderRadius: 12,
                    padding: 12,
                    backgroundColor: active ? C.tideLight : C.tide,
                    borderWidth: 1,
                    borderColor: active ? C.brass : "transparent",
                  }}
                >
                  <Text style={{ color: C.foam, fontSize: 14 }}>
                    {c.flag} {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ marginTop: 32 }}>
          <PrimaryButton
            label={submitting ? "Sealing your identity…" : "Wade in"}
            onPress={submit}
            disabled={!canSubmit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
