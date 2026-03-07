import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp, RefWithTags } from '../src/context/AppContext';
import { colors, fonts, spacing, radius, getCategoryColor, TYPE_CONFIG } from '../src/constants/theme';
import { parseDescription } from '../src/lib/supabase';
import { fetchSimilarIdeas } from '../src/lib/api';
import RefCard from '../src/components/RefCard';

const { width } = Dimensions.get('window');

export default function RefDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { allRefs, categories } = useApp();

  const [similarIds, setSimilarIds] = useState<string[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const ref = allRefs.find(r => r.id === params.id);
  const category = ref ? categories.find(c => c.id === ref.cat_id) : null;
  const { text: descText, image: thumbnail } = ref ? parseDescription(ref.description) : { text: '', image: null };

  // Fetch similar ideas
  useEffect(() => {
    if (!ref) return;
    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      try {
        const candidates = allRefs
          .filter(r => r.id !== ref.id)
          .map(r => ({
            id: r.id,
            title: r.title,
            description: parseDescription(r.description).text,
            tags: r.tags,
            cat_id: r.cat_id,
          }));
        const result = await fetchSimilarIdeas(
          ref.id,
          ref.title,
          descText,
          ref.tags,
          ref.cat_id,
          candidates
        );
        setSimilarIds(result.similar || []);
      } catch (e) {
        console.error('Similar ideas error:', e);
      }
      setLoadingSimilar(false);
    };
    fetchSimilar();
  }, [ref?.id]);

  const similarRefs = similarIds.map(id => allRefs.find(r => r.id === id)).filter(Boolean) as RefWithTags[];

  const handleOpenUrl = useCallback(() => {
    if (ref?.url) {
      Linking.openURL(ref.url);
    }
  }, [ref?.url]);

  const handlePreview = useCallback(() => {
    if (ref?.url) {
      router.push({
        pathname: '/preview',
        params: { url: encodeURIComponent(ref.url), title: encodeURIComponent(ref.title || 'Preview') },
      } as any);
    }
  }, [ref, router]);

  const handleSimilarPress = useCallback((item: RefWithTags) => {
    router.push({ pathname: '/ref-detail', params: { id: item.id } } as any);
  }, [router]);

  if (!ref) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reference</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Reference not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeConfig = TYPE_CONFIG[ref.type] || TYPE_CONFIG.link;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reference</Text>
        <TouchableOpacity onPress={handleOpenUrl} style={styles.backBtn}>
          <Feather name="external-link" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thumbnail */}
        {thumbnail && (
          <TouchableOpacity onPress={handlePreview} activeOpacity={0.9}>
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} contentFit="cover" />
            <View style={styles.previewOverlay}>
              <Feather name="eye" size={18} color={colors.textPrimary} />
              <Text style={styles.previewText}>Preview</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Main Info */}
        <View style={styles.infoSection}>
          {/* Type + Action Tag */}
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
            </View>
            {ref.action_tag && (
              <View style={[
                styles.actionBadge,
                { backgroundColor: ref.action_tag === 'to_execute' ? colors.coral + '20' : colors.lavender + '20' }
              ]}>
                <Feather
                  name={ref.action_tag === 'to_execute' ? 'zap' : 'star'}
                  size={12}
                  color={ref.action_tag === 'to_execute' ? colors.coral : colors.lavender}
                />
                <Text style={[
                  styles.actionBadgeText,
                  { color: ref.action_tag === 'to_execute' ? colors.coral : colors.lavender }
                ]}>
                  {ref.action_tag === 'to_execute' ? 'To Execute' : 'Inspiration'}
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{ref.title}</Text>

          {/* Description */}
          {descText ? <Text style={styles.description}>{descText}</Text> : null}

          {/* Category */}
          {category && (
            <View style={styles.categoryRow}>
              <View style={[styles.catDot, { backgroundColor: getCategoryColor(category.color) }]} />
              <Text style={styles.catName}>{category.name}</Text>
              {ref.subcat && (
                <>
                  <Text style={styles.catSep}>·</Text>
                  <Text style={styles.subcat}>{ref.subcat}</Text>
                </>
              )}
            </View>
          )}

          {/* Tags */}
          {ref.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {ref.tags.map((tag, i) => (
                <View key={i} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Meta */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Saved by {ref.author} · {new Date(ref.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Similar Ideas */}
        <View style={styles.similarSection}>
          <View style={styles.similarHeader}>
            <Feather name="layers" size={16} color={colors.lime} />
            <Text style={styles.similarTitle}>Similar Ideas</Text>
          </View>
          {loadingSimilar ? (
            <View style={styles.similarLoading}>
              <ActivityIndicator size="small" color={colors.lime} />
              <Text style={styles.similarLoadingText}>Finding similar references...</Text>
            </View>
          ) : similarRefs.length === 0 ? (
            <Text style={styles.noSimilar}>No similar references found</Text>
          ) : (
            <View style={styles.similarGrid}>
              {similarRefs.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.similarCard}
                  onPress={() => handleSimilarPress(item)}
                  activeOpacity={0.9}
                >
                  <RefCard item={item} categories={categories} compact />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.textPrimary },
  content: { padding: spacing.md, paddingBottom: 100 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
  thumbnail: {
    width: '100%', height: 220, borderRadius: radius.lg, backgroundColor: colors.surface,
  },
  previewOverlay: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full,
  },
  previewText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textPrimary },
  infoSection: { marginTop: spacing.lg, gap: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  typeBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.5 },
  actionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
  },
  actionBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.3 },
  title: { fontFamily: fonts.heading, fontSize: 24, color: colors.textPrimary, lineHeight: 32 },
  description: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
  catSep: { color: colors.textMuted },
  subcat: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagPill: {
    backgroundColor: colors.surfaceHigh, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full,
  },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  metaRow: { paddingTop: 4 },
  metaText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  similarSection: {
    marginTop: spacing.xl, paddingTop: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.borderSubtle,
  },
  similarHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  similarTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.textPrimary },
  similarLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: spacing.md },
  similarLoadingText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  noSimilar: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  similarGrid: { gap: spacing.md },
  similarCard: { width: '100%' },
});
