import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { colors, fonts, spacing, radius, CATEGORY_COLORS } from '../src/constants/theme';
import {
  insertTeamMember, deleteTeamMember, insertBoard, deleteBoard,
  insertBoardMember, removeMemberFromBoard, TeamMember, Board,
} from '../src/lib/supabase';

export default function TeamSetupScreen() {
  const router = useRouter();
  const { session, boards, teamMembers, boardMembers, refreshBoards, refreshTeamMembers } = useApp();
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddBoard, setShowAddBoard] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPin, setNewMemberPin] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'founder' | 'member'>('member');
  const [newBoardName, setNewBoardName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  const isFounder = session?.role === 'founder';

  // Members assigned to a board
  const getMembersForBoard = (boardId: string) => {
    const memberIds = boardMembers.filter(bm => bm.board_id === boardId).map(bm => bm.member_id);
    return teamMembers.filter(tm => memberIds.includes(tm.id));
  };

  // Members not assigned to a board
  const getUnassignedMembers = (boardId: string) => {
    const memberIds = boardMembers.filter(bm => bm.board_id === boardId).map(bm => bm.member_id);
    return teamMembers.filter(tm => !memberIds.includes(tm.id) && tm.role !== 'founder');
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      Alert.alert('Required', 'Please enter a name');
      return;
    }
    if (newMemberPin.length !== 4) {
      Alert.alert('Required', 'PIN must be 4 digits');
      return;
    }
    if (teamMembers.some(m => m.name.toLowerCase() === newMemberName.toLowerCase())) {
      Alert.alert('Duplicate', 'A member with this name already exists');
      return;
    }
    setSaving(true);
    try {
      await insertTeamMember({
        id: crypto.randomUUID(),
        name: newMemberName.trim(),
        pin: newMemberPin,
        role: newMemberRole,
      });
      await refreshTeamMembers();
      setNewMemberName('');
      setNewMemberPin('');
      setNewMemberRole('member');
      setShowAddMember(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add member');
    }
    setSaving(false);
  };

  const handleDeleteMember = (member: TeamMember) => {
    if (member.id === session?.memberId) {
      Alert.alert('Cannot delete', "You can't delete yourself");
      return;
    }
    Alert.alert(`Remove ${member.name}?`, 'This will remove them from all boards.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteTeamMember(member.id);
            await Promise.all([refreshTeamMembers(), refreshBoards()]);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not delete member');
          }
        },
      },
    ]);
  };

  const handleAddBoard = async () => {
    if (!newBoardName.trim()) {
      Alert.alert('Required', 'Please enter a board name');
      return;
    }
    if (!session) return;
    setSaving(true);
    try {
      await insertBoard({
        id: crypto.randomUUID(),
        name: newBoardName.trim(),
        founder_id: session.memberId,
      });
      await refreshBoards();
      setNewBoardName('');
      setShowAddBoard(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create board');
    }
    setSaving(false);
  };

  const handleDeleteBoard = (board: Board) => {
    Alert.alert(`Delete "${board.name}"?`, 'All references on this board will lose their board assignment.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteBoard(board.id);
            await refreshBoards();
            if (selectedBoard?.id === board.id) setSelectedBoard(null);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not delete board');
          }
        },
      },
    ]);
  };

  const handleAssignMember = async (boardId: string, memberId: string) => {
    try {
      await insertBoardMember(boardId, memberId);
      await refreshBoards();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not assign member');
    }
  };

  const handleUnassignMember = async (boardId: string, memberId: string) => {
    try {
      await removeMemberFromBoard(boardId, memberId);
      await refreshBoards();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not remove member');
    }
  };

  if (!isFounder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Team Setup</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Feather name="lock" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Founders Only</Text>
          <Text style={styles.emptyDesc}>
            Only team founders can manage boards and members. Contact your founder to make changes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Team Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Team Members</Text>
            <TouchableOpacity
              testID="add-member-btn"
              style={styles.addBtn}
              onPress={() => setShowAddMember(true)}
            >
              <Feather name="user-plus" size={14} color={colors.textInverse} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.memberList}>
            {teamMembers.map((member, i) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={[styles.avatar, { backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }]}>
                  <Text style={styles.avatarText}>{member.name[0].toUpperCase()}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>
                    {member.role === 'founder' ? 'Founder' : 'Team Member'} · PIN: {member.pin}
                  </Text>
                </View>
                {member.id !== session?.memberId && (
                  <TouchableOpacity
                    testID={`delete-member-${member.id}`}
                    onPress={() => handleDeleteMember(member)}
                    style={styles.deleteBtn}
                  >
                    <Feather name="trash-2" size={16} color={colors.coral} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Boards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Boards</Text>
            <TouchableOpacity
              testID="add-board-btn"
              style={styles.addBtn}
              onPress={() => setShowAddBoard(true)}
            >
              <Feather name="plus" size={14} color={colors.textInverse} />
              <Text style={styles.addBtnText}>New Board</Text>
            </TouchableOpacity>
          </View>
          {boards.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No boards yet. Create one to organize your references.</Text>
            </View>
          ) : (
            <View style={styles.boardList}>
              {boards.map((board, i) => {
                const members = getMembersForBoard(board.id);
                const unassigned = getUnassignedMembers(board.id);
                const isExpanded = selectedBoard?.id === board.id;
                return (
                  <View key={board.id} style={styles.boardCard}>
                    <TouchableOpacity
                      style={styles.boardHeader}
                      onPress={() => setSelectedBoard(isExpanded ? null : board)}
                    >
                      <View style={[styles.boardDot, { backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }]} />
                      <View style={styles.boardInfo}>
                        <Text style={styles.boardName}>{board.name}</Text>
                        <Text style={styles.boardMeta}>
                          {members.length} member{members.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Feather
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textMuted}
                      />
                      <TouchableOpacity
                        testID={`delete-board-${board.id}`}
                        onPress={() => handleDeleteBoard(board)}
                        style={styles.deleteBtn}
                      >
                        <Feather name="trash-2" size={16} color={colors.coral} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={styles.boardExpanded}>
                        <Text style={styles.subLabel}>ASSIGNED MEMBERS</Text>
                        {members.length === 0 ? (
                          <Text style={styles.noMembers}>No members assigned yet</Text>
                        ) : (
                          <View style={styles.chipRow}>
                            {members.map(m => (
                              <TouchableOpacity
                                key={m.id}
                                style={styles.memberChip}
                                onPress={() => handleUnassignMember(board.id, m.id)}
                              >
                                <Text style={styles.memberChipText}>{m.name}</Text>
                                <Feather name="x" size={12} color={colors.textMuted} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                        {unassigned.length > 0 && (
                          <>
                            <Text style={[styles.subLabel, { marginTop: 12 }]}>ADD MEMBERS</Text>
                            <View style={styles.chipRow}>
                              {unassigned.map(m => (
                                <TouchableOpacity
                                  key={m.id}
                                  style={[styles.memberChip, styles.memberChipAdd]}
                                  onPress={() => handleAssignMember(board.id, m.id)}
                                >
                                  <Feather name="plus" size={12} color={colors.lime} />
                                  <Text style={[styles.memberChipText, { color: colors.lime }]}>{m.name}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Member Modal */}
      <Modal visible={showAddMember} transparent animationType="slide" onRequestClose={() => setShowAddMember(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddMember(false)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.modalTitle}>Add Team Member</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NAME</Text>
              <TextInput
                testID="new-member-name"
                style={styles.textInput}
                value={newMemberName}
                onChangeText={setNewMemberName}
                placeholder="Enter name..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>4-DIGIT PIN</Text>
              <TextInput
                testID="new-member-pin"
                style={styles.textInput}
                value={newMemberPin}
                onChangeText={(t) => setNewMemberPin(t.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ROLE</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.rolePill, newMemberRole === 'member' && styles.rolePillActive]}
                  onPress={() => setNewMemberRole('member')}
                >
                  <Text style={[styles.rolePillText, newMemberRole === 'member' && styles.rolePillTextActive]}>
                    Team Member
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rolePill, newMemberRole === 'founder' && styles.rolePillActive]}
                  onPress={() => setNewMemberRole('founder')}
                >
                  <Text style={[styles.rolePillText, newMemberRole === 'founder' && styles.rolePillTextActive]}>
                    Founder
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              testID="save-member-btn"
              style={styles.saveBtn}
              onPress={handleAddMember}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={styles.saveBtnText}>Add Member</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Add Board Modal */}
      <Modal visible={showAddBoard} transparent animationType="slide" onRequestClose={() => setShowAddBoard(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddBoard(false)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.modalTitle}>Create Board</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BOARD NAME</Text>
              <TextInput
                testID="new-board-name"
                style={styles.textInput}
                value={newBoardName}
                onChangeText={setNewBoardName}
                placeholder="e.g., Brand Campaign Q1"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <TouchableOpacity
              testID="save-board-btn"
              style={styles.saveBtn}
              onPress={handleAddBoard}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={styles.saveBtnText}>Create Board</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textPrimary },
  content: { padding: spacing.md, gap: spacing.xl, paddingBottom: 100 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.textPrimary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.lime, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full,
  },
  addBtnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textInverse },
  memberList: { gap: 8 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.md,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.heading, fontSize: 17, color: colors.textInverse },
  memberInfo: { flex: 1 },
  memberName: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
  memberRole: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 8 },
  boardList: { gap: 8 },
  boardCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden',
  },
  boardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md,
  },
  boardDot: { width: 12, height: 12, borderRadius: 6 },
  boardInfo: { flex: 1 },
  boardName: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
  boardMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  boardExpanded: {
    padding: spacing.md, paddingTop: 0, borderTopWidth: 1, borderTopColor: colors.borderSubtle,
  },
  subLabel: {
    fontFamily: fonts.bodySemi, fontSize: 10, color: colors.textMuted, letterSpacing: 0.8, marginBottom: 8,
  },
  noMembers: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surfaceHigh, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full,
  },
  memberChipAdd: { backgroundColor: colors.lime + '15', borderWidth: 1, borderColor: colors.lime + '40' },
  memberChipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  emptyCardText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 16 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary },
  emptyDesc: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderWidth: 1, borderColor: colors.borderVisible, padding: spacing.lg, gap: spacing.md,
  },
  modalTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textPrimary },
  inputGroup: { gap: 6 },
  inputLabel: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.textMuted, letterSpacing: 0.8 },
  textInput: {
    backgroundColor: colors.surfaceHigh, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderVisible,
    padding: 12, fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary,
  },
  roleRow: { flexDirection: 'row', gap: 8 },
  rolePill: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surfaceHigh,
  },
  rolePillActive: { backgroundColor: colors.lime + '20', borderColor: colors.lime },
  rolePillText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted },
  rolePillTextActive: { color: colors.lime },
  saveBtn: {
    backgroundColor: colors.lime, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { fontFamily: fonts.heading, fontSize: 15, color: colors.textInverse },
});
