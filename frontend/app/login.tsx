import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../src/context/AppContext';
import { colors, fonts, spacing, radius } from '../src/constants/theme';
import Logo from '../src/components/Logo';

export default function LoginScreen() {
  const { teamMembers, login, loading } = useApp();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!selectedName) {
      setError('Please select your name');
      return;
    }
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    setLoggingIn(true);
    setError('');
    const result = await login(selectedName, pin);
    setLoggingIn(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const handlePinChange = (text: string) => {
    // Only allow digits, max 4
    const digits = text.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    setError('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.lime} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No team members yet - show setup message
  if (teamMembers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Logo size="lg" />
          <Text style={styles.emptyTitle}>Welcome to RefBoard</Text>
          <Text style={styles.emptyDesc}>
            No team members found. Ask your Founder to set up the team first, or if you're the Founder, add yourself in the Supabase dashboard.
          </Text>
          <View style={styles.helpBox}>
            <Feather name="info" size={16} color={colors.lavender} />
            <Text style={styles.helpText}>
              Insert a row into `team_members` table with your name, a 4-digit PIN, and role "founder".
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Logo size="lg" />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Select your name and enter your PIN</Text>
          </View>

          {/* Name Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>WHO'S THIS?</Text>
            <View style={styles.nameGrid}>
              {teamMembers.map((member) => {
                const isSelected = selectedName === member.name;
                const isFounder = member.role === 'founder';
                return (
                  <TouchableOpacity
                    key={member.id}
                    testID={`name-option-${member.name}`}
                    style={[
                      styles.nameCard,
                      isSelected && styles.nameCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedName(member.name);
                      setError('');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.avatar,
                      isSelected && { backgroundColor: colors.lime },
                    ]}>
                      <Text style={[
                        styles.avatarText,
                        isSelected && { color: colors.textInverse },
                      ]}>
                        {member.name[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[
                      styles.nameText,
                      isSelected && { color: colors.lime },
                    ]}>
                      {member.name}
                    </Text>
                    {isFounder && (
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>Founder</Text>
                      </View>
                    )}
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Feather name="check" size={14} color={colors.lime} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* PIN Input */}
          <View style={styles.section}>
            <Text style={styles.label}>4-DIGIT PIN</Text>
            <View style={styles.pinRow}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.pinDot,
                    pin.length > i && styles.pinDotFilled,
                  ]}
                >
                  {pin.length > i && <View style={styles.pinDotInner} />}
                </View>
              ))}
            </View>
            <TextInput
              testID="pin-input"
              style={styles.hiddenInput}
              value={pin}
              onChangeText={handlePinChange}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus={false}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.pinInputTouchable}
              onPress={() => {
                // Focus the hidden input
              }}
            >
              <Text style={styles.pinHint}>Tap to enter PIN</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color={colors.coral} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Login Button */}
          <TouchableOpacity
            testID="login-btn"
            style={[
              styles.loginBtn,
              (!selectedName || pin.length !== 4) && styles.loginBtnDisabled,
            ]}
            onPress={handleLogin}
            disabled={loggingIn || !selectedName || pin.length !== 4}
          >
            {loggingIn ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.loginBtnText}>Enter RefBoard</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 20,
  },
  emptyTitle: {
    fontFamily: fonts.heading, fontSize: 24, color: colors.textPrimary, marginTop: 24,
  },
  emptyDesc: {
    fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22,
  },
  helpBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.lavender + '30',
  },
  helpText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, flex: 1, lineHeight: 19 },
  scrollContent: {
    padding: spacing.lg, paddingTop: 60, gap: spacing.xl,
  },
  header: { alignItems: 'center', gap: 12 },
  title: {
    fontFamily: fonts.heading, fontSize: 28, color: colors.textPrimary, marginTop: 32, letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, textAlign: 'center',
  },
  section: { gap: 12 },
  label: {
    fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textMuted, letterSpacing: 1,
  },
  nameGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  nameCard: {
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  nameCardSelected: {
    borderColor: colors.lime + '60',
    backgroundColor: colors.lime + '10',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.heading, fontSize: 20, color: colors.textPrimary,
  },
  nameText: {
    fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary,
  },
  roleBadge: {
    backgroundColor: colors.lavender + '25',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
  },
  roleBadgeText: {
    fontFamily: fonts.bodySemi, fontSize: 10, color: colors.lavender, letterSpacing: 0.5,
  },
  checkBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.lime + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  pinRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 20,
  },
  pinDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.borderVisible,
    alignItems: 'center', justifyContent: 'center',
  },
  pinDotFilled: {
    borderColor: colors.lime,
  },
  pinDotInner: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.lime,
  },
  hiddenInput: {
    position: 'absolute', top: -1000, left: -1000,
  },
  pinInputTouchable: {
    alignSelf: 'center', paddingVertical: 8,
  },
  pinHint: {
    fontFamily: fonts.body, fontSize: 13, color: colors.textMuted,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.coral + '15', borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.coral + '30',
  },
  errorText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.coral, flex: 1 },
  loginBtn: {
    backgroundColor: colors.lime, borderRadius: radius.full,
    paddingVertical: 18, alignItems: 'center', marginTop: spacing.md,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: {
    fontFamily: fonts.heading, fontSize: 17, color: colors.textInverse, letterSpacing: -0.3,
  },
});
