import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing, getCategoryColor } from '../constants/theme';
import { Category } from '../lib/supabase';

interface FilterBarProps {
  categories: Category[];
  selectedCat: string | null;
  selectedType: string | null;
  onSelectCat: (id: string | null) => void;
  onSelectType: (type: string | null) => void;
}

const TYPES = [
  { key: null, label: 'All' },
  { key: 'reel', label: 'Reel' },
  { key: 'image', label: 'Image' },
  { key: 'link', label: 'Link' },
  { key: 'note', label: 'Note' },
];

export default function FilterBar({
  categories,
  selectedCat,
  selectedType,
  onSelectCat,
  onSelectType,
}: FilterBarProps) {
  return (
    <View style={styles.container}>
      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        testID="category-filter-bar"
      >
        <TouchableOpacity
          testID="filter-cat-all"
          style={[styles.chip, !selectedCat && styles.chipActive]}
          onPress={() => onSelectCat(null)}
        >
          <Text style={[styles.chipText, !selectedCat && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((cat) => {
          const isActive = selectedCat === cat.id;
          const catHexColor = getCategoryColor(cat.color);
          return (
            <TouchableOpacity
              testID={`filter-cat-${cat.id}`}
              key={cat.id}
              style={[
                styles.chip,
                isActive && { backgroundColor: catHexColor + '25', borderColor: catHexColor },
              ]}
              onPress={() => onSelectCat(isActive ? null : cat.id)}
            >
              {cat.color ? (
                <View style={[styles.dot, { backgroundColor: catHexColor }]} />
              ) : null}
              <Text style={[styles.chipText, isActive && { color: catHexColor }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Type filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        testID="type-filter-bar"
      >
        {TYPES.map((t) => {
          const isActive = selectedType === t.key;
          return (
            <TouchableOpacity
              testID={`filter-type-${t.key || 'all'}`}
              key={String(t.key)}
              style={[styles.typeChip, isActive && styles.typeChipActive]}
              onPress={() => onSelectType(isActive ? null : t.key)}
            >
              <Text style={[styles.typeText, isActive && styles.typeTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.lime + '20',
    borderColor: colors.lime,
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.lime,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  typeChipActive: {
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.borderVisible,
  },
  typeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  typeTextActive: {
    color: colors.textPrimary,
  },
});
