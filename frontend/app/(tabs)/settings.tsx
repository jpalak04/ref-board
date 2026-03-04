import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';

const AVATAR_COLORS = [
  colors.lime, colors.coral, colors.lavender, colors.cream,
  colors.teal, colors.amber,
];

export default function SettingsScreen() {
  const { teamMembers, setTeamMembers, selectedMember, setSelectedMember } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAddMember = async () => {
    const name = newName.trim();
    if (!name) { Alert.alert('Required', 'Please enter a name'); return; }
    if (teamMembers.includes(name)) { Alert.alert('Duplicate', `${name} already exists`); return; }
    await setTeamMembers([...teamMembers, name]);
    setNewName('');
    setShowAddModal(false);
  };

  const handleRemoveMember = (name: string) => {
    if (teamMembers.length <= 1) {
      Alert.alert('Cannot remove', 'You must have at least one team member');
      return;
    }
    Alert.alert(`Remove ${name}?`, 'This will not delete their saved references.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const updated = teamMembers.filter((m) => m !== name);
          await setTeamMembers(updated);
          if (selectedMember === name) {
            await setSelectedMember(updated[0]);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team</Text>
        <TouchableOpacity testID="add-member-btn" onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Feather name="user-plus" size={16} color={colors.textInverse} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Team members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          <Text style={styles.sectionDesc}>
            Select your name when saving. Everyone shares the same board in real time.
          </Text>
          <View style={styles.memberList}>
            {teamMembers.map((member, index) => {
              const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
              const isActive = selectedMember === member;
              return (
                <TouchableOpacity
                  testID={`member-item-${member}`}
                  key={member}
                  style={[styles.memberRow, isActive && styles.memberRowActive]}
                  onPress={() => setSelectedMember(member)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarText}>{member[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{member}</Text>
                    {isActive && <Text style={styles.memberActive}>Currently saving as</Text>}
                  </View>
                  <View style={styles.memberRight}>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Feather name="check" size={12} color={colors.lime} />
                      </View>
                    )}
                    <TouchableOpacity
                      testID={`remove-member-${member}`}
                      onPress={() => handleRemoveMember(member)}
                      style={styles.removeBtn}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <Feather name="x" size={15} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* App info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>RefBoard</Text>
          <Text style={styles.infoDesc}>
            A shared reference library for creative teams. Save links, reels, images and notes from Instagram and the web.
          </Text>
          <View style={styles.infoRow}>
            <View style={styles.infoPill}>
              <View style={[styles.infoDot, { backgroundColor: colors.lime }]} />
              <Text style={styles.infoPillText}>Supabase Realtime</Text>
            </View>
            <View style={styles.infoPill}>
              <View style={[styles.infoDot, { backgroundColor: colors.coral }]} />
              <Text style={styles.infoPillText}>Gemini AI</Text>
            </View>
          </View>
        </View>

        {/* Share intent info */}
        <View style={styles.shareSection}>
          <View style={styles.shareHeader}>
            <Feather name="share-2" size={16} color={colors.lavender} />
            <Text style={styles.shareTitle}>Share from any app</Text>
          </View>
          <Text style={styles.shareDesc}>
            After publishing the app, RefBoard will appear in your iOS/Android share sheet. Tap Share in Instagram, Safari, or any app — RefBoard will open and auto-fill everything instantly.
          </Text>
        </View>
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
        >
          <TouchableOpacity
            style={styles.modalSheet}
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={styles.modalTitle}>Add Team Member</Text>
            <TextInput
              testID="new-member-input"
              style={styles.textInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter name…"
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddMember}
            />
            <TouchableOpacity
              testID="confirm-add-member-btn"
              style={styles.modalSaveBtn}
              onPress={handleAddMember}
            >
              <Text style={styles.modalSaveBtnText}>Add to Team</Text>
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
  content: { padding: spacing.md, gap: spacing.xl, paddingBottom: 100 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.textPrimary },
  sectionDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  memberList: { gap: 8 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  memberRowActive: {
    borderColor: colors.lime + '50',
    backgroundColor: colors.lime + '08',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.heading, fontSize: 17, color: colors.textInverse },
  memberName: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
  memberActive: { fontFamily: fonts.body, fontSize: 11, color: colors.lime, marginTop: 2 },
  memberRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.lime + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: { padding: 4 },
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: 8,
  },
  infoTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.textPrimary },
  infoDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  infoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  infoDot: { width: 6, height: 6, borderRadius: 3 },
  infoPillText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textSecondary },
  shareSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lavender + '30',
    padding: spacing.md,
    gap: 8,
  },
  shareHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.lavender },
  shareDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textPrimary },
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
  modalSaveBtn: {
    backgroundColor: colors.lime,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveBtnText: { fontFamily: fonts.heading, fontSize: 15, color: colors.textInverse },
});
