import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface LetterViewProps {
  text: string;
  driftDays?: number;
  ocean?: string;
  scrollable?: boolean;
}

export function LetterView({ text, driftDays, ocean, scrollable = false }: LetterViewProps) {
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
      {(driftDays !== undefined || ocean) && (
        <Text style={[styles.meta, { color: colors.ink }]}>
          {[ocean, driftDays !== undefined && `${driftDays} days adrift`]
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
    fontFamily: 'IMFellEnglish_400Italic',
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
