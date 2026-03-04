import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../constants/theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md' }: LogoProps) {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';
  const tileSize = isSmall ? 8 : isLarge ? 14 : 10;
  const gap = isSmall ? 2 : isLarge ? 3 : 2;
  const markSize = isSmall ? 28 : isLarge ? 48 : 36;
  const textSize = isSmall ? 15 : isLarge ? 24 : 18;

  const tileColors = [colors.lime, colors.coral, colors.cream, colors.lavender];

  return (
    <View style={styles.row}>
      {/* Mark */}
      <View style={[styles.mark, { width: markSize, height: markSize, borderRadius: markSize * 0.28 }]}>
        <View style={[styles.grid, { gap }]}>
          {tileColors.map((c, i) => (
            <View
              key={i}
              style={[
                styles.tile,
                {
                  width: tileSize,
                  height: tileSize,
                  borderRadius: tileSize * 0.3,
                  backgroundColor: c,
                  opacity: i === 0 ? 1 : i === 1 ? 0.85 : i === 2 ? 0.65 : 0.5,
                },
              ]}
            />
          ))}
        </View>
      </View>
      {/* Wordmark */}
      <View style={styles.wordmark}>
        <Text style={[styles.wordRef, { fontSize: textSize }]}>Ref</Text>
        <Text style={[styles.wordBoard, { fontSize: textSize }]}>Board</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderVisible,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 'auto',
  },
  tile: {},
  wordmark: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordRef: {
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  wordBoard: {
    fontFamily: fonts.heading,
    color: colors.lime,
    letterSpacing: -0.5,
  },
});
