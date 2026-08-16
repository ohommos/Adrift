import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

// Structural shape of what expo-router's <Tabs tabBar> hands us, declared
// locally so this does not depend on reaching into a transitive package.
interface TabBarProps {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

const LABELS: Record<string, string> = {
  index: 'Tide',
  haul: 'Inbox',
  chart: 'Planet',
  scrawl: 'Write',
  crew: 'You',
};

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'wind',
  haul: 'inbox',
  scrawl: 'send',
  crew: 'user',
};

/** The globe that sits in the raised centre button. */
function PlanetGlyph({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={10} fill="none" stroke={color} strokeWidth={1.6} />
      <Ellipse cx={13} cy={13} rx={4.2} ry={10} fill="none" stroke={color} strokeWidth={1.2} opacity={0.85} />
      <Line x1={3.4} y1={10} x2={22.6} y2={10} stroke={color} strokeWidth={1.2} opacity={0.85} />
      <Line x1={3.4} y1={16} x2={22.6} y2={16} stroke={color} strokeWidth={1.2} opacity={0.85} />
      <Circle cx={18} cy={8} r={1.8} fill={color} />
    </Svg>
  );
}

export function TabBar({ state, navigation }: TabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 20 : 8);

  const go = (index: number, name: string) => {
    const isFocused = state.index === index;
    const event = navigation.emit({ type: 'tabPress', target: state.routes[index].key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(name);
  };

  const renderSide = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    if (!route) return null;
    const focused = state.index === routeIndex;
    const tint = focused ? colors.primary : colors.mutedForeground;
    return (
      <Pressable
        key={route.key}
        onPress={() => go(routeIndex, route.name)}
        style={styles.item}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
      >
        <Feather
          name={ICONS[route.name] ?? 'circle'}
          size={20}
          color={tint}
          style={{ opacity: focused ? 1 : 0.9 }}
        />
        <Text style={[styles.label, { color: tint }]}>{LABELS[route.name] ?? route.name}</Text>
      </Pressable>
    );
  };

  // Route order is index, haul, chart, scrawl, crew — chart takes the centre.
  const centreIndex = state.routes.findIndex((r: { name: string }) => r.name === 'chart');
  const onPlanet = state.index === centreIndex;

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]} pointerEvents="box-none">
      <LinearGradient
        colors={['transparent', colors.background]}
        locations={[0, 0.34]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.row}>
        {renderSide(0)}
        {renderSide(1)}

        <Pressable onPress={() => go(centreIndex, 'chart')} style={styles.centreItem} accessibilityRole="button">
          <View
            style={[
              styles.centreButton,
              {
                backgroundColor: onPlanet ? colors.primary : colors.secondary,
                borderColor: onPlanet ? colors.primary : colors.secondary,
                shadowColor: onPlanet ? colors.primary : '#000',
                shadowOpacity: onPlanet ? 0.45 : 0.4,
              },
            ]}
          >
            <PlanetGlyph color={onPlanet ? colors.background : colors.foreground} />
          </View>
          <Text style={[styles.label, { color: onPlanet ? colors.primary : colors.mutedForeground }]}>
            Planet
          </Text>
        </Pressable>

        {renderSide(3)}
        {renderSide(4)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  item: { width: 62, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontFamily: 'Cinzel_400Regular' },
  centreItem: { width: 62, alignItems: 'center', marginBottom: 2 },
  centreButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 3,
  },
});
