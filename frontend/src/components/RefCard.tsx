import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, spacing, TYPE_CONFIG, getCategoryColor } from '../constants/theme';
import { Ref, Category, parseDescription } from '../lib/supabase';

interface RefWithTags extends Ref {
  tags?: string[];
}

interface RefCardProps {
  item: RefWithTags;
  categories: Category[];
  onDelete?: (id: string) => void;
  compact?: boolean;
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

export default function RefCard({ item, categories, compact = false }: RefCardProps) {
  const { text: descText, image: thumbnail } = parseDescription(item.description);
  const category = categories.find((c) => c.id === item.cat_id);
  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.link;
  const catColor = getCategoryColor(category?.color || '');
  const tags = item.tags || [];

  return (
    <View testID={`ref-card-${item.id}`} style={[styles.card, compact && styles.cardCompact]}>
      {/* Thumbnail */}
      {thumbnail ? (
        <View style={[styles.thumbContainer, compact && styles.thumbContainerCompact]}>
          <Image
            source={{ uri: thumbnail }}
            style={styles.thumb}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.typeBadge}>
            <Text style={[styles.typeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          </View>
          {item.action_tag === 'to_execute' && (
            <View style={styles.actionIndicator}>
              <Feather name="zap" size={10} color={colors.coral} />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noThumbHeader}>
          <View style={[styles.typePill, { borderColor: typeConfig.color + '40' }]}>
            <Text style={[styles.typeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          </View>
          {item.action_tag === 'to_execute' && (
            <View style={[styles.actionIndicator, { position: 'relative', marginLeft: 6 }]}>
              <Feather name="zap" size={10} color={colors.coral} />
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={compact ? 1 : 2}>
          {item.title || 'Untitled'}
        </Text>

        {!compact && descText ? (
          <Text style={styles.desc} numberOfLines={2}>{descText}</Text>
        ) : null}

        {/* Tags */}
        {!compact && tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          {category ? (
            <View style={[styles.catChip, { backgroundColor: catColor + '20', borderColor: catColor + '50' }]}>
              <View style={[styles.catDot, { backgroundColor: catColor }]} />
              <Text style={[styles.catText, { color: catColor }]} numberOfLines={1}>
                {category.name}
                {!compact && item.subcat ? ` · ${item.subcat}` : ''}
              </Text>
            </View>
          ) : null}
          {!compact && (
            <View style={styles.meta}>
              <Text style={styles.author}>{item.author || 'Team'}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
            </View>
          )}
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
  cardCompact: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  thumbContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1.6,
  },
  thumbContainerCompact: {
    width: 80,
    height: 80,
    aspectRatio: 1,
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
  actionIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.coral + '30',
    borderRadius: radius.full,
    padding: 4,
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
  contentCompact: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  titleCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  tagPill: {
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tagText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
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
