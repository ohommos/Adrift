import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/TabBar';

// One custom bar on every platform. The raised centre Planet button is the
// app's main affordance and the native tab bars cannot express it, so the
// NativeTabs/liquid-glass variant is deliberately not used here.
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Tide' }} />
      <Tabs.Screen name="haul" options={{ title: 'Inbox' }} />
      <Tabs.Screen name="chart" options={{ title: 'Planet' }} />
      <Tabs.Screen name="scrawl" options={{ title: 'Write' }} />
      <Tabs.Screen name="crew" options={{ title: 'You' }} />
    </Tabs>
  );
}
