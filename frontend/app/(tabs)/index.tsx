import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, Dimensions, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import FilterBar from '../../src/components/FilterBar';
import RefCard from '../../src/components/RefCard';
import Logo from '../../src/components/Logo';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { deleteRef } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isDesktop = width >= 1024;
const isTablet = width >= 768;

export default function HomeScreen() {
  const { refs, categories, loading, refreshRefs, session, currentBoard, logout } = useApp();
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleCardPress = useCallback((item: any) => {
    router.push({ pathname: '/ref-detail', params: { id: item.id } } as any);
  }, [router]);

  const filtered = useMemo(() => {
    let result = refs;
    if (selectedCat) result = result.filter((r) => r.cat_id === selectedCat);
    if (selectedType) result = result.filter((r) => r.type === selectedType);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) => 
          r.title?.toLowerCase().includes(q) || 
          (r.description || '').toLowerCase().includes(q) ||
          r.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [refs, selectedCat, selectedType, searchQuery]);

  const numCols = isDesktop ? 4 : isTablet ? 3 : 2;
  const columns: typeof filtered[] = Array.from({ length: numCols }, (_, i) =>
    filtered.filter((_, idx) => idx % numCols === i)
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshRefs();
    setRefreshing(false);
  }, [refreshRefs]);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert('Remove Reference', 'Are you sure you want to delete this?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteRef(id);
            setSelectedRef(null);
          } catch (e) {
            Alert.alert('Error', 'Could not delete reference');
          }
        },
      },
    ]);
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  }, [logout]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuBtn}>
          <Logo size="md" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            testID="search-toggle-btn"
            onPress={() => { setShowSearch((v) => !v); if (showSearch) setSearchQuery(''); }}
            style={styles.iconBtn}
          >
            <Feather name={showSearch ? 'x' : 'search'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {(selectedCat || selectedType) && (
            <TouchableOpacity
              testID="clear-filters-btn"
              onPress={() => { setSelectedCat(null); setSelectedType(null); }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Board indicator for members */}
      {session?.role === 'member' && currentBoard && (
        <View style={styles.boardBanner}>
          <Feather name="folder" size={14} color={colors.lavender} />
          <Text style={styles.boardBannerText}>{currentBoard.name}</Text>
        </View>
      )}

      {/* Search bar */}
      {showSearch && (
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="Search titles, descriptions, tags…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersWrap}>
        <FilterBar
          categories={categories}
          selectedCat={selectedCat}
          selectedType={selectedType}
          onSelectCat={setSelectedCat}
          onSelectType={setSelectedType}
        />
      </View>

      {/* Grid */}
      <ScrollView
        testID="home-feed-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lime} />}
      >
        {loading && refs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⬡</Text>
            <Text style={styles.emptyTitle}>Loading board…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>
              {refs.length === 0 ? 'Your board is empty' : 'No matches'}
            </Text>
            <Text style={styles.emptyDesc}>
              {refs.length === 0
                ? 'Tap the + button to save your first reference'
                : 'Try different filters or search terms'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.countRow}>
              <Text style={styles.countText}>{filtered.length} reference{filtered.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.grid}>
              {columns.map((col, ci) => (
                <View key={ci} style={styles.col}>
                  {col.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.9}
                      onPress={() => handleCardPress(item)}
                      onLongPress={() => setSelectedRef(item.id)}
                      delayLongPress={500}
                      testID={`card-press-${item.id}`}
                    >
                      <RefCard item={item} categories={categories} />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Long-press delete modal */}
      <Modal
        visible={!!selectedRef}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRef(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedRef(null)}
        >
          <View style={styles.actionSheet}>
            <Text style={styles.actionTitle}>Reference options</Text>
            <TouchableOpacity
              testID="delete-ref-btn"
              style={styles.actionItem}
              onPress={() => selectedRef && handleDelete(selectedRef)}
            >
              <Feather name="trash-2" size={18} color={colors.coral} />
              <Text style={[styles.actionText, { color: colors.coral }]}>Delete reference</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => setSelectedRef(null)}>
              <Feather name="x" size={18} color={colors.textSecondary} />
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Menu modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuSheet}>
            <View style={styles.menuHeader}>
              <Logo size="sm" />
              <Text style={styles.menuUserName}>{session?.name}</Text>
              <View style={[styles.roleBadge, session?.role === 'founder' && styles.roleBadgeFounder]}>
                <Text style={[styles.roleBadgeText, session?.role === 'founder' && styles.roleBadgeTextFounder]}>
                  {session?.role === 'founder' ? 'Founder' : 'Member'}
                </Text>
              </View>
            </View>
            {session?.role === 'founder' && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { setShowMenu(false); router.push('/team-setup'); }}
              >
                <Feather name="settings" size={18} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>Team Setup</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setShowMenu(false); router.push('/(tabs)/categories'); }}
            >
              <Feather name="folder" size={18} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>Categories</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}
              onPress={() => { setShowMenu(false); handleLogout(); }}
            >
              <Feather name="log-out" size={18} color={colors.coral} />
              <Text style={[styles.menuItemText, { color: colors.coral }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  menuBtn: { padding: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6 },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
  },
  clearText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  boardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.lavender + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.lavender + '20',
  },
  boardBannerText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.lavender },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  filtersWrap: { paddingTop: spacing.sm, paddingBottom: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 100 },
  countRow: { paddingBottom: spacing.sm },
  countText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted },
  grid: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: { fontSize: 36, color: colors.textMuted },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textSecondary },
  emptyDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    padding: spacing.lg,
    gap: 4,
  },
  actionTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  actionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  menuSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    padding: spacing.lg,
  },
  menuHeader: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  menuUserName: { fontFamily: fonts.heading, fontSize: 18, color: colors.textPrimary, marginTop: 8 },
  roleBadge: {
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  roleBadgeFounder: { backgroundColor: colors.lavender + '25' },
  roleBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textMuted },
  roleBadgeTextFounder: { color: colors.lavender },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  menuItemText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.textPrimary },
});
