import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { C, theme } from "../theme/theme";
import { PRO_PRICE_USD } from "@adrift/shared";
import { PrimaryButton } from "./ui";

export function Paywall({
  visible,
  onClose,
  onUnlock,
}: {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(5,17,26,0.65)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable style={{ backgroundColor: C.tide, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Sparkles size={18} color={C.brass} />
            <Text style={{ fontFamily: theme.display, fontSize: 18, color: C.foam }}>Adrift Pro</Text>
          </View>
          <Text style={{ color: C.foamDim, fontSize: 13.5, lineHeight: 20, marginBottom: 18 }}>
            Your first reply is always free. After that, three bottles passed on or broken earns another
            — or skip the work, once, forever.
          </Text>
          <View style={{ backgroundColor: C.tideLight, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            {[
              "Reply to anyone, any time — no passing on required",
              "Send to any city on the planet",
              "One payment, no subscription, ever",
            ].map((t) => (
              <Text key={t} style={{ color: C.foam, fontSize: 13, marginBottom: 6 }}>
                ✓ {t}
              </Text>
            ))}
          </View>
          <PrimaryButton label={`Unlock Pro for $${PRO_PRICE_USD}`} onPress={onUnlock} />
          <Pressable onPress={onClose} style={{ paddingVertical: 12, alignItems: "center" }}>
            <Text style={{ color: C.foamDim, fontSize: 13 }}>Not now</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
