import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { colors, fonts, radius, spacing, TYPE_CONFIG } from '../constants/theme';
import { Ref, Category, parseDescription } from '../lib/supabase';

interface RefCardProps {
  item: Ref;
  categories: Category[];
  onDelete?: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export default function RefCard({ item, categories }: RefCardProps) {
  const { text: descText, image: thumbnail } = parseDescription(item.description);
  const category = categories.find((c) => c.id === item.cat_id);
  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.link;
  const catColor = category?.color || colors.lavender;

  return (
    <View testID={`ref-card-${item.id}`} style={styles.card}>
      {/* Thumbnail */}
      {thumbnail ? (
        <View style={styles.thumbContainer}>
          <Image
            source={{ uri: thumbnail }}
            style={styles.thumb}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.typeBadge}>
            <Text style={[styles.typeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noThumbHeader}>
          <View style={[styles.typePill, { borderColor: typeConfig.color + '40' }]}>
            <Text style={[styles.typeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{item.title || 'Untitled'}</Text>

        {descText ? (
          <Text style={styles.desc} numberOfLines={2}>{descText}</Text>
        ) : null}

        <View style={styles.footer}>
          {category ? (
            <View style={[styles.catChip, { backgroundColor: catColor + '20', borderColor: catColor + '50' }]}>
              <View style={[styles.catDot, { backgroundColor: catColor }]} />
              <Text style={[styles.catText, { color: catColor }]} numberOfLines={1}>
                {category.name}
                {item.subcat ? ` · ${item.subcat}` : ''}
              </Text>
            </View>
          ) : null}
          <View style={styles.meta}>
            <Text style={styles.author}>{item.author || 'Team'}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  thumbContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1.6,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  noThumbHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typePill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  content: {
    padding: spacing.md,
    gap: 6,
  },
  title: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  footer: {
    marginTop: 4,
    gap: 6,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    maxWidth: '100%',
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    flexShrink: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  author: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  dot: {
    fontSize: 10,
    color: colors.textMuted,
  },
  time: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
});
