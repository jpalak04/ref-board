import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Modal, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { colors, fonts, spacing, radius, TYPE_CONFIG, CATEGORY_COLORS, getCategoryColor } from '../../src/constants/theme';
import { fetchOG, aiAutofill } from '../../src/lib/api';
import { insertRef, buildDescription } from '../../src/lib/supabase';

const TYPES = ['link', 'reel', 'image', 'note'] as const;
type RefType = typeof TYPES[number];

function isValidUrl(url: string) {
  try { new URL(url); return true; } catch { return false; }
}

export default function AddScreen() {
  const { categories, teamMembers, selectedMember, setSelectedMember } = useApp();
  const params = useLocalSearchParams<{ url?: string }>();
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [type, setType] = useState<RefType>('link');
  const [catId, setCatId] = useState<string | null>(null);
  const [subcat, setSubcat] = useState<string | null>(null);
  const [author, setAuthor] = useState(selectedMember || teamMembers[0] || '');

  const [fetchingOG, setFetchingOG] = useState(false);
  const [fetchingAI, setFetchingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle incoming URL from deep link / share
  useEffect(() => {
    if (params.url) {
      setUrl(decodeURIComponent(params.url));
    }
  }, [params.url]);

  // Auto-analyze when URL changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!url || !isValidUrl(url)) {
      setThumbnail(null);
      return;
    }
    debounceRef.current = setTimeout(() => analyzeUrl(url), 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [url]);

  // Animate preview in
  useEffect(() => {
    if (thumbnail || title) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [thumbnail, title]);

  const analyzeUrl = useCallback(async (targetUrl: string) => {
    setFetchingOG(true);
    setAiSuggested(false);
    try {
      const og = await fetchOG(targetUrl);
      if (og.title) setTitle(og.title);
      if (og.description) setDescription(og.description);
      if (og.image) setThumbnail(og.image);
      if (og.type) setType(og.type as RefType);

      // Now run AI categorization
      if (categories.length > 0) {
        setFetchingAI(true);
        try {
          const ai = await aiAutofill(
            targetUrl,
            og.title,
            og.description,
            categories.map((c) => ({ id: c.id, name: c.name, subs: c.subs || [] }))
          );
          if (ai.cat_id) {
            // Validate cat_id against actual categories (by ID or by name fallback)
            const matchById = categories.find((c) => c.id === ai.cat_id);
            const matchByName = !matchById
              ? categories.find((c) => c.name.toLowerCase() === (ai.cat_id || '').toLowerCase())
              : null;
            const matched = matchById || matchByName;
            if (matched) {
              setCatId(matched.id);
              setAiSuggested(true);
            }
          }
          if (ai.subcat) setSubcat(ai.subcat);
          if (ai.content_type) setType(ai.content_type as RefType);
        } catch (aiErr) {
          console.warn('AI autofill error:', aiErr);
        }
        setFetchingAI(false);
      }
    } catch (e) {
      console.error('OG fetch error:', e);
    }
    setFetchingOG(false);
  }, [categories]);

  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text.trim());
  }, []);

  const handleSave = useCallback(async () => {
    if (!url.trim()) { Alert.alert('Missing URL', 'Please enter a URL to save'); return; }
    if (!catId) { Alert.alert('Missing Category', 'Please select a category'); return; }
    if (!author.trim()) { Alert.alert('Missing Author', 'Please select your name'); return; }

    setSaving(true);
    try {
      await insertRef({
        id: generateId(),
        type,
        title: title || url,
        url,
        description: buildDescription(description, thumbnail),
        cat_id: catId,
        subcat: subcat || '',
        author: author.trim(),
      });

      // Success animation
      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(successAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setSaved(false);
        resetForm();
        router.push('/(tabs)');
      });
      setSaved(true);
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Could not save reference');
    }
    setSaving(false);
  }, [url, title, description, thumbnail, type, catId, subcat, author]);

  const resetForm = () => {
    setUrl(''); setTitle(''); setDescription(''); setThumbnail(null);
    setType('link'); setCatId(null); setSubcat(null); setAiSuggested(false);
  };

  const selectedCat = categories.find((c) => c.id === catId);
  const availableSubs = selectedCat?.subs || [];
  const isLoading = fetchingOG || fetchingAI;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quick Save</Text>
          {(url || title) && (
            <TouchableOpacity testID="clear-form-btn" onPress={resetForm} style={styles.iconBtn}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* URL Input */}
          <View style={styles.section}>
            <Text style={styles.label}>URL</Text>
            <View style={styles.urlRow}>
              <TextInput
                testID="url-input"
                style={styles.urlInput}
                placeholder="Paste link here…"
                placeholderTextColor={colors.textMuted}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                multiline={false}
              />
              <TouchableOpacity
                testID="paste-btn"
                onPress={handlePaste}
                style={styles.pasteBtn}
              >
                <Feather name="clipboard" size={16} color={colors.lime} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Loading state */}
          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.lime} />
              <Text style={styles.loadingText}>
                {fetchingAI ? 'AI categorizing…' : 'Fetching preview…'}
              </Text>
            </View>
          )}

          {/* Preview Card */}
          {(thumbnail || title) ? (
            <Animated.View style={[styles.previewCard, { opacity: fadeAnim }]}>
              {thumbnail ? (
                <Image
                  source={{ uri: thumbnail }}
                  style={styles.previewThumb}
                  contentFit="cover"
                />
              ) : null}
              <View style={styles.previewContent}>
                {aiSuggested && (
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>✦ AI suggested</Text>
                  </View>
                )}
                <TextInput
                  testID="title-input"
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
                <TextInput
                  testID="description-input"
                  style={styles.descInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </Animated.View>
          ) : null}

          {/* Type Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => {
                const cfg = TYPE_CONFIG[t];
                const active = type === t;
                return (
                  <TouchableOpacity
                    testID={`type-pill-${t}`}
                    key={t}
                    style={[
                      styles.typePill,
                      active && { backgroundColor: cfg.color + '25', borderColor: cfg.color },
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typePillText, active && { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Category Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              testID="category-picker-btn"
              style={styles.selectorBtn}
              onPress={() => setShowCatModal(true)}
            >
              {selectedCat ? (
                <View style={styles.selectorRow}>
                  <View style={[styles.catDot, { backgroundColor: getCategoryColor(selectedCat.color) }]} />
                  <Text style={styles.selectorText}>{selectedCat.name}</Text>
                  {aiSuggested && <Text style={styles.aiTag}>AI</Text>}
                </View>
              ) : (
                <Text style={styles.selectorPlaceholder}>Select category…</Text>
              )}
              <Feather name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Sub-category */}
            {availableSubs.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.subScroll}
                contentContainerStyle={styles.subRow}
              >
                {availableSubs.map((sub) => (
                  <TouchableOpacity
                    testID={`subcat-pill-${sub}`}
                    key={sub}
                    style={[
                      styles.subPill,
                      subcat === sub && {
                        backgroundColor: (selectedCat?.color || colors.lime) + '25',
                        borderColor: selectedCat?.color || colors.lime,
                      },
                    ]}
                    onPress={() => setSubcat(subcat === sub ? null : sub)}
                  >
                    <Text
                      style={[
                        styles.subPillText,
                        subcat === sub && { color: selectedCat?.color || colors.lime },
                      ]}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Author Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Saved by</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.authorRow}
            >
              {teamMembers.map((member) => (
                <TouchableOpacity
                  testID={`author-chip-${member}`}
                  key={member}
                  style={[
                    styles.authorChip,
                    author === member && styles.authorChipActive,
                  ]}
                  onPress={() => { setAuthor(member); setSelectedMember(member); }}
                >
                  <View style={[styles.authorAvatar, author === member && { backgroundColor: colors.lime }]}>
                    <Text style={[styles.authorInitial, author === member && { color: colors.textInverse }]}>
                      {member[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.authorName, author === member && { color: colors.lime }]}>
                    {member}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.saveWrap}>
          <TouchableOpacity
            testID="save-btn"
            style={[styles.saveBtn, (saving || saved) && { opacity: 0.8 }]}
            onPress={handleSave}
            disabled={saving || saved}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : saved ? (
              <View style={styles.savedRow}>
                <Feather name="check" size={18} color={colors.textInverse} />
                <Text style={styles.saveBtnText}>Saved!</Text>
              </View>
            ) : (
              <Text style={styles.saveBtnText}>Save to Board</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <Modal visible={showCatModal} transparent animationType="slide" onRequestClose={() => setShowCatModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCatModal(false)}>
          <View style={styles.catModal}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  testID={`cat-option-${cat.id}`}
                  key={cat.id}
                  style={[styles.catOption, catId === cat.id && styles.catOptionActive]}
                  onPress={() => {
                    setCatId(cat.id);
                    setSubcat(null);
                    setAiSuggested(false);
                    setShowCatModal(false);
                  }}
                >
                  <View style={[styles.catOptionDot, { backgroundColor: getCategoryColor(cat.color) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catOptionName}>{cat.name}</Text>
                    {cat.subs?.length > 0 && (
                      <Text style={styles.catOptionSubs}>{cat.subs.slice(0, 3).join(' · ')}</Text>
                    )}
                  </View>
                  {catId === cat.id && <Feather name="check" size={16} color={colors.lime} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
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
  headerTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary, letterSpacing: -0.5 },
  iconBtn: { padding: 6 },
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: 20 },
  section: { gap: spacing.sm },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    overflow: 'hidden',
  },
  urlInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    padding: spacing.md,
  },
  pasteBtn: {
    padding: spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderSubtle,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  loadingText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    overflow: 'hidden',
  },
  previewThumb: { width: '100%', height: 180 },
  previewContent: { padding: spacing.md, gap: 8 },
  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lime + '20',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.lime + '40',
  },
  aiBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.lime },
  titleInput: {
    fontFamily: fonts.headingSemi,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  descInput: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    maxHeight: 80,
  },
  typeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  typePillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    padding: spacing.md,
  },
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectorText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
  selectorPlaceholder: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  aiTag: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.lime,
    backgroundColor: colors.lime + '20',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  subScroll: { marginTop: 4 },
  subRow: { gap: 8, paddingVertical: 2 },
  subPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  subPillText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted },
  authorRow: { gap: 10, paddingVertical: 2 },
  authorChip: {
    alignItems: 'center',
    gap: 5,
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minWidth: 64,
  },
  authorChipActive: {
    backgroundColor: colors.lime + '15',
    borderColor: colors.lime + '60',
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: { fontFamily: fonts.heading, fontSize: 15, color: colors.textPrimary },
  authorName: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textSecondary },
  saveWrap: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  saveBtn: {
    backgroundColor: colors.lime,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.lime,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  saveBtnText: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textInverse,
    letterSpacing: -0.3,
  },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  catModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  catOptionActive: { backgroundColor: colors.surfaceHigh },
  catOptionDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  catOptionName: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
  catOptionSubs: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
