import "react-native-gesture-handler";
import React from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { C } from "./src/theme/theme";
import { useAppFonts } from "./src/theme/useAppFonts";
import { IdentityProvider, useIdentity } from "./src/identity/IdentityContext";
import { ComposeProvider } from "./src/identity/ComposeContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";

const queryClient = new QueryClient();

function Gate() {
  const { status } = useIdentity();

  if (status === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: C.abyss, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.brass} />
      </View>
    );
  }

  if (status === "onboarding") {
    return <OnboardingScreen />;
  }

  return (
    <ComposeProvider>
      <RootNavigator />
    </ComposeProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.abyss, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.brass} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <IdentityProvider>
            <StatusBar barStyle="light-content" />
            <Gate />
          </IdentityProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
