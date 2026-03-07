import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { colors, fonts, spacing, radius, CATEGORY_COLORS } from '../../src/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { session, teamMembers, boards, assignedBoards, logout } = useApp();

  const isFounder = session?.role === 'founder';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team</Text>
        {isFounder && (
          <TouchableOpacity
            testID="team-setup-btn"
            onPress={() => router.push('/team-setup')}
            style={styles.setupBtn}
          >
            <Feather name="settings" size={14} color={colors.textInverse} />
            <Text style={styles.setupBtnText}>Setup</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current User */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signed in as</Text>
          <View style={styles.userCard}>
            <View style={[styles.avatar, { backgroundColor: colors.lime }]}>
              <Text style={styles.avatarText}>{session?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{session?.name}</Text>
              <View style={[styles.roleBadge, isFounder && styles.roleBadgeFounder]}>
                <Text style={[styles.roleBadgeText, isFounder && styles.roleBadgeTextFounder]}>
                  {isFounder ? 'Founder' : 'Team Member'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Assigned Boards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isFounder ? 'All Boards' : 'Your Boards'}
          </Text>
          {assignedBoards.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {isFounder 
                  ? 'No boards created yet. Tap Setup to create one.'
                  : 'No boards assigned yet. Ask your Founder to add you to a board.'}
              </Text>
            </View>
          ) : (
            <View style={styles.boardList}>
              {assignedBoards.map((board, i) => (
                <View key={board.id} style={styles.boardRow}>
                  <View style={[styles.boardDot, { backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }]} />
                  <Text style={styles.boardName}>{board.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Team Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          <Text style={styles.sectionDesc}>
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} in your team
          </Text>
          <View style={styles.memberList}>
            {teamMembers.map((member, index) => {
              const avatarColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              const isCurrent = member.id === session?.memberId;
              return (
                <View key={member.id} style={[styles.memberRow, isCurrent && styles.memberRowActive]}>
                  <View style={[styles.memberAvatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.memberAvatarText}>{member.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>
                      {member.role === 'founder' ? 'Founder' : 'Team Member'}
                    </Text>
                  </View>
                  {isCurrent && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>You</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>RefBoard V2</Text>
          <Text style={styles.infoDesc}>
            A shared reference library for creative teams. Save links, reels, images and notes with AI-powered categorization.
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

        {/* Sign Out */}
        <TouchableOpacity
          testID="logout-btn"
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={18} color={colors.coral} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
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
  headerTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary, letterSpacing: -0.5 },
  setupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.lime, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full,
  },
  setupBtnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textInverse },
  content: { padding: spacing.md, gap: spacing.xl, paddingBottom: 100 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.textPrimary },
  sectionDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.lime + '30', padding: spacing.md,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.heading, fontSize: 20, color: colors.textInverse },
  userInfo: { gap: 4 },
  userName: { fontFamily: fonts.heading, fontSize: 18, color: colors.textPrimary },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceHigh, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full,
  },
  roleBadgeFounder: { backgroundColor: colors.lavender + '25' },
  roleBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textMuted },
  roleBadgeTextFounder: { color: colors.lavender },
  boardList: { gap: 8 },
  boardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  boardDot: { width: 10, height: 10, borderRadius: 5 },
  boardName: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  memberList: { gap: 8 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.md,
  },
  memberRowActive: { borderColor: colors.lime + '50', backgroundColor: colors.lime + '08' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontFamily: fonts.heading, fontSize: 17, color: colors.textInverse },
  memberInfo: { flex: 1 },
  memberName: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
  memberRole: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  youBadge: {
    backgroundColor: colors.lime + '25', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
  },
  youBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.lime },
  infoSection: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.md, gap: 8,
  },
  infoTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.textPrimary },
  infoDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  infoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surfaceHigh, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full,
  },
  infoDot: { width: 6, height: 6, borderRadius: 3 },
  infoPillText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textSecondary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.coral + '15', borderRadius: radius.md, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.coral + '30',
  },
  logoutBtnText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.coral },
});
