import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import RefCard from '../../src/components/RefCard';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { deleteRef, updateRef } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function ExecuteScreen() {
  const { refs, categories, loading, refreshRefs } = useApp();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Filter for "to_execute" action tag
  const executeRefs = useMemo(() => {
    return refs.filter(r => r.action_tag === 'to_execute');
  }, [refs]);

  const numCols = isTablet ? 2 : 1;
  const columns: typeof executeRefs[] = Array.from({ length: numCols }, (_, i) =>
    executeRefs.filter((_, idx) => idx % numCols === i)
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshRefs();
    setRefreshing(false);
  }, [refreshRefs]);

  const handleCardPress = useCallback((item: any) => {
    router.push({ pathname: '/ref-detail', params: { id: item.id } } as any);
  }, [router]);

  const handleMarkDone = useCallback(async (id: string) => {
    Alert.alert('Mark as Done', 'Move this to Inspiration?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Done',
        onPress: async () => {
          try {
            await updateRef(id, { action_tag: 'inspiration' });
          } catch (e) {
            Alert.alert('Error', 'Could not update reference');
          }
        },
      },
    ]);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert('Delete Reference', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteRef(id); } catch {}
        },
      },
    ]);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="zap" size={20} color={colors.coral} />
          <Text style={styles.headerTitle}>To Execute</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{executeRefs.length}</Text>
        </View>
      </View>

      <ScrollView
        testID="execute-feed-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lime} />}
      >
        {loading && executeRefs.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="loader" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Loading...</Text>
          </View>
        ) : executeRefs.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="check-circle" size={48} color={colors.lime} />
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptyDesc}>
              No items to execute right now. When you save references with "To Execute" tag, they'll appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {columns.map((col, ci) => (
              <View key={ci} style={styles.col}>
                {col.map((item) => (
                  <View key={item.id} style={styles.cardWrap}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleCardPress(item)}
                      testID={`execute-card-${item.id}`}
                    >
                      <RefCard item={item} categories={categories} />
                    </TouchableOpacity>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.doneBtn}
                        onPress={() => handleMarkDone(item.id)}
                        testID={`done-btn-${item.id}`}
                      >
                        <Feather name="check" size={14} color={colors.lime} />
                        <Text style={styles.doneBtnText}>Done</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item.id)}
                        testID={`delete-btn-${item.id}`}
                      >
                        <Feather name="trash-2" size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
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
    backgroundColor: colors.coral + '25',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  countText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.coral },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 100 },
  grid: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  cardWrap: { marginBottom: 4 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.lime + '30',
  },
  doneBtnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.lime },
  deleteBtn: { padding: 8 },
  emptyState: { alignItems: 'center', paddingTop: 100, gap: 16 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary },
  emptyDesc: {
    fontFamily: fonts.body, fontSize: 14, color: colors.textMuted,
    textAlign: 'center', maxWidth: 280, lineHeight: 20,
  },
});
