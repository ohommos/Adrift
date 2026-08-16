import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { BottleSummary, InboxItem } from '@/lib/api';
import { STATE_LABEL } from '@/lib/labels';

/**
 * The two feeds carry genuinely different shapes: your own bottles have a
 * drift state, while an inbox entry withholds its text until you open it.
 * Discriminating on `mode` keeps each branch honest about what it can read.
 */
type BottleCardProps =
  | {
      mode?: 'mine';
      bottle: BottleSummary;
      onPress: () => void;
      unread?: boolean;
    }
  | {
      mode: 'inbox';
      bottle: InboxItem;
      onPress: () => void;
      unread?: boolean;
    };

export function BottleCard(props: BottleCardProps) {
  const { onPress, unread = false } = props;
  const mode = props.mode ?? 'mine';
  const colors = useColors();

  const state = mode === 'mine' ? (props.bottle as BottleSummary).state : null;
  const passOnCount = props.bottle.passOnCount;

  const statusColor =
    state === 'lost'
      ? colors.wax
      : state === 'opened' || passOnCount > 0
        ? colors.seaglass
        : colors.primary;

  // An unopened inbox entry deliberately carries no text — reading .length off
  // it is what crashed the Haul tab for every new user.
  const body = props.bottle.text;
  const preview = body
    ? body.length > 90
      ? body.slice(0, 90) + '…'
      : body
    : 'Sealed — open it to read what is inside.';

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
          {mode === 'mine' && state ? STATE_LABEL[state] : 'Adrift to you'}
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
            <Stat
              icon="anchor"
              value={(props.bottle as BottleSummary).region}
              label="waters"
              colors={colors}
            />
            <Stat icon="repeat" value={String(passOnCount)} label="shores" colors={colors} />
            <Stat
              icon="globe"
              value={String((props.bottle as BottleSummary).countries.length)}
              label="countries"
              colors={colors}
            />
          </>
        ) : (
          <>
            <Stat icon="repeat" value={String(passOnCount)} label="shores" colors={colors} />
            <Stat
              icon="mail"
              value={(props.bottle as InboxItem).opened ? 'Opened' : 'Sealed'}
              label="state"
              colors={colors}
            />
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
