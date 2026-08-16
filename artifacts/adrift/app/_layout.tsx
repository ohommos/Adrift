import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useFonts } from 'expo-font';
import { PirataOne_400Regular } from '@expo-google-fonts/pirata-one';
import { Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import {
  Spectral_400Regular,
  Spectral_400Italic,
  Spectral_600SemiBold,
} from '@expo-google-fonts/spectral';
import {
  IMFellEnglish_400Regular,
  IMFellEnglish_400Italic,
} from '@expo-google-fonts/im-fell-english';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { IdentityProvider, useIdentity } from '@/context/IdentityContext';
import { ComposeProvider } from '@/context/ComposeContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading, hasIdentity } = useIdentity();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    // Guard only the auth boundary. Anything stricter (e.g. "bounce every
    // non-tab route back to the tabs") would also eject the stack routes the
    // app pushes on top of the tabs — /scope, /read/:id, /tracker/:id, …
    const inOnboarding = segments[0] === 'onboarding';
    if (!hasIdentity && !inOnboarding) {
      router.replace('/onboarding');
    } else if (hasIdentity && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [isLoading, hasIdentity, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="scope" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="sent" options={{ headerShown: false }} />
      <Stack.Screen name="reply-sent" options={{ headerShown: false }} />
      <Stack.Screen name="tracker/[bottleId]" options={{ headerShown: false }} />
      <Stack.Screen name="read/[bottleId]" options={{ headerShown: false }} />
      <Stack.Screen name="fate/[bottleId]" options={{ headerShown: false }} />
      <Stack.Screen name="reply/[bottleId]" options={{ headerShown: false }} />
      <Stack.Screen name="city/[cityId]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PirataOne_400Regular,
    Cinzel_400Regular,
    Cinzel_700Bold,
    Spectral_400Regular,
    Spectral_400Italic,
    Spectral_600SemiBold,
    IMFellEnglish_400Regular,
    IMFellEnglish_400Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <IdentityProvider>
                <ComposeProvider>
                  <RootLayoutNav />
                </ComposeProvider>
              </IdentityProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
