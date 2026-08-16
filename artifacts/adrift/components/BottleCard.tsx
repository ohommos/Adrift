import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Bottle } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  drifting: 'Drifting',
  beached: 'Beached',
  sunk: 'Lost at sea',
  opened: 'Opened',
};

interface BottleCardProps {
  bottle: Bottle;
  onPress: () => void;
  /** 'mine' shows drift stats; 'inbox' shows received indicator */
  mode?: 'mine' | 'inbox';
  unread?: boolean;
}

export function BottleCard({ bottle, onPress, mode = 'mine', unread = false }: BottleCardProps) {
  const colors = useColors();

  const statusColor =
    bottle.status === 'sunk'
      ? colors.wax
      : bottle.status === 'opened' || bottle.openCount > 0
      ? colors.seaglass
      : colors.primary;

  const preview =
    bottle.text.length > 90 ? bottle.text.slice(0, 90) + '…' : bottle.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: unread ? colors.primary : colors.border,
          borderWidth: unread ? 1.5 : 1,
        },
      ]}
    >
      {/* Status dot + label */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusLabel, { color: statusColor, fontFamily: 'Cinzel_400Regular' }]}>
          {STATUS_LABELS[bottle.status] ?? bottle.status}
        </Text>
        {unread && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.unreadText, { color: colors.primaryForeground }]}>NEW</Text>
          </View>
        )}
      </View>

      {/* Message preview */}
      <Text
        style={[styles.preview, { color: colors.foreground, fontFamily: 'Spectral_400Regular' }]}
        numberOfLines={2}
      >
        {preview}
      </Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {mode === 'mine' ? (
          <>
            <Stat icon="wind" value={`${bottle.driftDays}d`} label="drift" colors={colors} />
            <Stat icon="eye" value={String(bottle.openCount)} label="opens" colors={colors} />
            <Stat icon="globe" value={String(bottle.countriesVisited)} label="countries" colors={colors} />
          </>
        ) : (
          <>
            <Stat icon="anchor" value={bottle.currentOcean ?? '—'} label="found on" colors={colors} />
            <Stat icon="clock" value={`${bottle.driftDays}d`} label="adrift" colors={colors} />
          </>
        )}
        <View style={{ flex: 1 }} />
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function Stat({
  icon,
  value,
  label,
  colors,
}: {
  icon: string;
  value: string;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.stat}>
      <Feather name={icon as never} size={11} color={colors.mutedForeground} />
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: 'Cinzel_400Regular' }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Spectral_400Regular' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 11,
    letterSpacing: 1,
  },
  unreadBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadText: {
    fontSize: 9,
    fontFamily: 'Cinzel_400Regular',
    letterSpacing: 0.5,
  },
  preview: {
    fontSize: 15,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
  },
  statLabel: {
    fontSize: 11,
  },
});
