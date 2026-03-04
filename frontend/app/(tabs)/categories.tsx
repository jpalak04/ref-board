import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { colors, fonts, spacing, radius, CATEGORY_COLORS } from '../../src/constants/theme';
import { insertCategory, updateCategory, deleteCategory } from '../../src/lib/supabase';

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface EditState {
  id?: string;
  name: string;
  color: string;
  subs: string[];
  newSub: string;
}

const DEFAULT_EDIT: EditState = {
  name: '',
  color: CATEGORY_COLORS[0],
  subs: [],
  newSub: '',
};

export default function CategoriesScreen() {
  const { categories, refreshCategories } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editState, setEditState] = useState<EditState>(DEFAULT_EDIT);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditState(DEFAULT_EDIT);
    setShowModal(true);
  };

  const openEdit = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    setEditState({ id: cat.id, name: cat.name, color: cat.color || CATEGORY_COLORS[0], subs: cat.subs || [], newSub: '' });
    setShowModal(true);
  };

  const handleAddSub = () => {
    const sub = editState.newSub.trim();
    if (!sub || editState.subs.includes(sub)) return;
    setEditState((s) => ({ ...s, subs: [...s.subs, sub], newSub: '' }));
  };

  const handleRemoveSub = (sub: string) => {
    setEditState((s) => ({ ...s, subs: s.subs.filter((x) => x !== sub) }));
  };

  const handleSave = async () => {
    if (!editState.name.trim()) { Alert.alert('Required', 'Category name is required'); return; }
    setSaving(true);
    try {
      if (editState.id) {
        await updateCategory(editState.id, {
          name: editState.name.trim(),
          color: editState.color,
          subs: editState.subs,
        });
      } else {
        await insertCategory({
          id: generateId(),
          name: editState.name.trim(),
          color: editState.color,
          subs: editState.subs,
        });
      }
      await refreshCategories();
      setShowModal(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save category');
    }
    setSaving(false);
  };

  const handleDelete = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    Alert.alert(`Delete "${cat?.name}"?`, 'This will not delete saved references in this category.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(catId);
            await refreshCategories();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not delete category');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity testID="add-category-btn" onPress={openAdd} style={styles.addBtn}>
          <Feather name="plus" size={18} color={colors.textInverse} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHint}>
          {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} · Long press a sub-category to remove
        </Text>
        {categories.map((cat) => (
          <View testID={`category-card-${cat.id}`} key={cat.id} style={styles.catCard}>
            <View style={styles.catHeader}>
              <View style={styles.catLeft}>
                <View style={[styles.colorBar, { backgroundColor: cat.color || colors.lime }]} />
                <Text style={styles.catName}>{cat.name}</Text>
              </View>
              <View style={styles.catActions}>
                <TouchableOpacity
                  testID={`edit-cat-${cat.id}`}
                  onPress={() => openEdit(cat.id)}
                  style={styles.actionBtn}
                >
                  <Feather name="edit-2" size={15} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`delete-cat-${cat.id}`}
                  onPress={() => handleDelete(cat.id)}
                  style={styles.actionBtn}
                >
                  <Feather name="trash-2" size={15} color={colors.coral} />
                </TouchableOpacity>
              </View>
            </View>
            {cat.subs && cat.subs.length > 0 && (
              <View style={styles.subWrap}>
                {cat.subs.map((sub) => (
                  <View key={sub} style={[styles.subChip, { borderColor: (cat.color || colors.lime) + '40' }]}>
                    <Text style={[styles.subChipText, { color: cat.color || colors.lime }]}>{sub}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <TouchableOpacity
            style={styles.modalSheet}
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={styles.modalTitle}>
              {editState.id ? 'Edit Category' : 'New Category'}
            </Text>

            {/* Name */}
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              testID="cat-name-input"
              style={styles.textInput}
              value={editState.name}
              onChangeText={(v) => setEditState((s) => ({ ...s, name: v }))}
              placeholder="e.g. Inspiration"
              placeholderTextColor={colors.textMuted}
            />

            {/* Color Picker */}
            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorRow}>
              {CATEGORY_COLORS.map((c) => (
                <TouchableOpacity
                  testID={`color-option-${c}`}
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    editState.color === c && styles.colorOptionActive,
                  ]}
                  onPress={() => setEditState((s) => ({ ...s, color: c }))}
                />
              ))}
            </View>

            {/* Sub-categories */}
            <Text style={styles.fieldLabel}>Sub-categories</Text>
            <View style={styles.subAddRow}>
              <TextInput
                testID="subcat-input"
                style={[styles.textInput, { flex: 1 }]}
                value={editState.newSub}
                onChangeText={(v) => setEditState((s) => ({ ...s, newSub: v }))}
                placeholder="Add sub-category…"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={handleAddSub}
              />
              <TouchableOpacity testID="add-subcat-btn" onPress={handleAddSub} style={styles.addSubBtn}>
                <Feather name="plus" size={18} color={colors.lime} />
              </TouchableOpacity>
            </View>

            {editState.subs.length > 0 && (
              <View style={styles.subChipsEdit}>
                {editState.subs.map((sub) => (
                  <TouchableOpacity
                    testID={`remove-subcat-${sub}`}
                    key={sub}
                    style={styles.subChipEdit}
                    onPress={() => handleRemoveSub(sub)}
                  >
                    <Text style={styles.subChipEditText}>{sub}</Text>
                    <Feather name="x" size={11} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              testID="save-category-btn"
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color={colors.textInverse} /> : (
                <Text style={styles.saveBtnText}>{editState.id ? 'Update' : 'Create Category'}</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
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
  headerTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary, letterSpacing: -0.5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  addBtnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textInverse },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  sectionHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  catCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: 10,
  },
  catHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  colorBar: { width: 4, height: 20, borderRadius: 2 },
  catName: { fontFamily: fonts.headingSemi, fontSize: 16, color: colors.textPrimary },
  catActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },
  subWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  subChipText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textPrimary, marginBottom: 4 },
  fieldLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  textInput: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
  },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorOption: { width: 28, height: 28, borderRadius: 14 },
  colorOptionActive: {
    borderWidth: 2.5,
    borderColor: colors.textPrimary,
    transform: [{ scale: 1.15 }],
  },
  subAddRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addSubBtn: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderVisible,
  },
  subChipsEdit: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subChipEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderVisible,
  },
  subChipEditText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  saveBtn: {
    backgroundColor: colors.lime,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { fontFamily: fonts.heading, fontSize: 15, color: colors.textInverse },
});
