import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// NativeTabs (iOS 26+) with liquid glass — system appearance, no custom brand colors.
function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'water.waves', selected: 'water.waves' }} />
        <Label>Tides</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="haul">
        <Icon sf={{ default: 'envelope', selected: 'envelope.fill' }} />
        <Label>Haul</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chart">
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <Label>Chart</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scrawl">
        <Icon sf={{ default: 'pencil', selected: 'pencil' }} />
        <Label>Scrawl</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="crew">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Crew</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// Classic tab bar for older iOS, Android, and web.
function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const safeAreaInsets = useSafeAreaInsets();

  function tabIcon(
    sfName: string,
    featherName: string,
    color: string
  ) {
    if (isIOS) return <SymbolView name={sfName} tintColor={color} size={24} />;
    return <Feather name={featherName as never} size={22} color={color} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: isWeb ? 0 : safeAreaInsets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'dark'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tides',
          tabBarIcon: ({ color }) => tabIcon('water.waves', 'anchor', color),
        }}
      />
      <Tabs.Screen
        name="haul"
        options={{
          title: 'Haul',
          tabBarIcon: ({ color }) => tabIcon('envelope', 'mail', color),
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          title: 'Chart',
          tabBarIcon: ({ color }) => tabIcon('map', 'map', color),
        }}
      />
      <Tabs.Screen
        name="scrawl"
        options={{
          title: 'Scrawl',
          tabBarIcon: ({ color }) => tabIcon('pencil', 'edit-2', color),
        }}
      />
      <Tabs.Screen
        name="crew"
        options={{
          title: 'Crew',
          tabBarIcon: ({ color }) => tabIcon('person', 'user', color),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
