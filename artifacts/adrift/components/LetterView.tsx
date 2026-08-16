import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface LetterViewProps {
  text: string;
  /** How many shores the bottle has reached — the server's pass-on count. */
  shores?: number;
  ocean?: string;
  scrollable?: boolean;
}

export function LetterView({ text, shores, ocean, scrollable = false }: LetterViewProps) {
  const colors = useColors();

  const content = (
    <View
      style={[
        styles.paper,
        {
          backgroundColor: colors.parchment,
          shadowColor: colors.ink,
        },
      ]}
    >
      {/* Decorative top rule */}
      <View style={[styles.rule, { backgroundColor: colors.ink }]} />

      {/* Voyage note */}
      {(shores !== undefined || ocean) && (
        <Text style={[styles.meta, { color: colors.ink }]}>
          {[
            ocean,
            shores !== undefined &&
              `${shores} ${shores === 1 ? 'shore' : 'shores'} reached`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      )}

      {/* The letter text */}
      <Text style={[styles.letterText, { color: colors.ink }]}>{text}</Text>

      {/* Bottom rule */}
      <View style={[styles.rule, { backgroundColor: colors.ink, marginTop: 20, marginBottom: 0 }]} />
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {content}
      </ScrollView>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
  },
  paper: {
    borderRadius: 6,
    padding: 24,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  rule: {
    height: 1,
    opacity: 0.2,
    marginBottom: 16,
  },
  meta: {
    fontFamily: 'IMFellEnglish_400Regular_Italic',
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 16,
    textAlign: 'center',
  },
  letterText: {
    fontFamily: 'IMFellEnglish_400Regular',
    fontSize: 18,
    lineHeight: 30,
  },
});
