import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import RefCard from '../../src/components/RefCard';
import { colors, fonts, spacing, radius, getCategoryColor } from '../../src/constants/theme';
import { fetchWeeklyDigest } from '../../src/lib/api';
import { useRouter } from 'expo-router';

export default function DigestScreen() {
  const { refs, categories, loading, refreshRefs } = useApp();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [digest, setDigest] = useState<{ summary: string; by_category: any[]; total: number } | null>(null);
  const [loadingDigest, setLoadingDigest] = useState(false);

  // Filter refs from last 7 days
  const weekRefs = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return refs.filter(r => new Date(r.created_at) >= weekAgo);
  }, [refs]);

  // Fetch AI digest
  useEffect(() => {
    const fetchDigest = async () => {
      if (weekRefs.length === 0) {
        setDigest(null);
        return;
      }
      setLoadingDigest(true);
      try {
        const result = await fetchWeeklyDigest(weekRefs, categories);
        setDigest(result);
      } catch (e) {
        console.error('Digest error:', e);
      }
      setLoadingDigest(false);
    };
    fetchDigest();
  }, [weekRefs.length, categories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshRefs();
    setRefreshing(false);
  }, [refreshRefs]);

  const handleCardPress = useCallback((item: any) => {
    router.push({ pathname: '/ref-detail', params: { id: item.id } } as any);
  }, [router]);

  // Group by day
  const groupedByDay = useMemo(() => {
    const groups: { [key: string]: typeof weekRefs } = {};
    weekRefs.forEach(ref => {
      const date = new Date(ref.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(ref);
    });
    return Object.entries(groups).sort((a, b) => {
      // Most recent first
      const dateA = new Date(a[1][0].created_at);
      const dateB = new Date(b[1][0].created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [weekRefs]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="calendar" size={20} color={colors.lavender} />
          <Text style={styles.headerTitle}>This Week</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{weekRefs.length} saved</Text>
        </View>
      </View>

      <ScrollView
        testID="digest-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lime} />}
      >
        {loading && weekRefs.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.lime} />
            <Text style={styles.emptyTitle}>Loading...</Text>
          </View>
        ) : weekRefs.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nothing this week</Text>
            <Text style={styles.emptyDesc}>
              Start saving references and they'll appear in your weekly digest.
            </Text>
          </View>
        ) : (
          <>
            {/* AI Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.aiIcon}>
                  <Text style={styles.aiIconText}>✦</Text>
                </View>
                <Text style={styles.summaryLabel}>AI Summary</Text>
              </View>
              {loadingDigest ? (
                <View style={styles.summaryLoading}>
                  <ActivityIndicator size="small" color={colors.lime} />
                  <Text style={styles.summaryLoadingText}>Generating summary...</Text>
                </View>
              ) : digest ? (
                <Text style={styles.summaryText}>{digest.summary}</Text>
              ) : (
                <Text style={styles.summaryText}>No summary available</Text>
              )}
            </View>

            {/* Category Breakdown */}
            {digest?.by_category && digest.by_category.length > 0 && (
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>By Category</Text>
                <View style={styles.breakdownList}>
                  {digest.by_category.map((cat, i) => (
                    <View key={cat.cat_id || i} style={styles.breakdownRow}>
                      <View style={[styles.catDot, { backgroundColor: getCategoryColor(cat.color) }]} />
                      <Text style={styles.breakdownName}>{cat.cat_name}</Text>
                      <View style={styles.breakdownCountWrap}>
                        <Text style={styles.breakdownCount}>{cat.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Timeline by Day */}
            {groupedByDay.map(([date, dayRefs]) => (
              <View key={date} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayDot} />
                  <Text style={styles.dayTitle}>{date}</Text>
                  <Text style={styles.dayCount}>{dayRefs.length}</Text>
                </View>
                <View style={styles.dayRefs}>
                  {dayRefs.slice(0, 3).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.9}
                      onPress={() => handleCardPress(item)}
                      testID={`digest-card-${item.id}`}
                    >
                      <RefCard item={item} categories={categories} compact />
                    </TouchableOpacity>
                  ))}
                  {dayRefs.length > 3 && (
                    <Text style={styles.moreText}>+{dayRefs.length - 3} more</Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary, letterSpacing: -0.5 },
  countBadge: {
    backgroundColor: colors.lavender + '25',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  countText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.lavender },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 100, gap: spacing.lg },
  emptyState: { alignItems: 'center', paddingTop: 100, gap: 16 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary },
  emptyDesc: {
    fontFamily: fonts.body, fontSize: 14, color: colors.textMuted,
    textAlign: 'center', maxWidth: 280, lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lime + '30',
    padding: spacing.md,
    gap: 12,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.lime + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  aiIconText: { fontSize: 12, color: colors.lime },
  summaryLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.lime, letterSpacing: 0.5 },
  summaryLoading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryLoadingText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  summaryText: { fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: 12,
  },
  breakdownTitle: { fontFamily: fonts.headingSemi, fontSize: 14, color: colors.textSecondary },
  breakdownList: { gap: 8 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownName: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
  breakdownCountWrap: {
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  breakdownCount: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  daySection: { gap: 12 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lavender },
  dayTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: colors.textPrimary, flex: 1 },
  dayCount: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  dayRefs: { gap: 8, paddingLeft: 18 },
  moreText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, paddingVertical: 4 },
});
