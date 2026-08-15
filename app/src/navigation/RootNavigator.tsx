import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { C } from "../theme/theme";
import { HomeScreen } from "../screens/HomeScreen";
import { PlanetScreen } from "../screens/PlanetScreen";
import { DiveScreen } from "../screens/DiveScreen";
import { CityScreen } from "../screens/CityScreen";
import { TrackerScreen } from "../screens/TrackerScreen";
import { ComposeScreen } from "../screens/ComposeScreen";
import { ScopeScreen } from "../screens/ScopeScreen";
import { SentScreen } from "../screens/SentScreen";
import { InboxScreen } from "../screens/InboxScreen";
import { ReadScreen } from "../screens/ReadScreen";
import { FateScreen } from "../screens/FateScreen";
import { ReplyScreen } from "../screens/ReplyScreen";
import { ReplySentScreen } from "../screens/ReplySentScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.abyss },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Planet" component={PlanetScreen} />
        <Stack.Screen name="Dive" component={DiveScreen} />
        <Stack.Screen name="City" component={CityScreen} />
        <Stack.Screen name="Tracker" component={TrackerScreen} />
        <Stack.Screen name="Compose" component={ComposeScreen} />
        <Stack.Screen name="Scope" component={ScopeScreen} />
        <Stack.Screen name="Sent" component={SentScreen} />
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="Read" component={ReadScreen} />
        <Stack.Screen name="Fate" component={FateScreen} />
        <Stack.Screen name="Reply" component={ReplyScreen} />
        <Stack.Screen name="ReplySent" component={ReplySentScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
