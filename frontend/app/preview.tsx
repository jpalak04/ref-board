import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, spacing, radius } from '../src/constants/theme';

// Conditionally import WebView only on native
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export default function PreviewScreen() {
  const { url, title, thumbnail } = useLocalSearchParams<{
    url: string;
    title: string;
    thumbnail?: string;
  }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const webViewRef = React.useRef<any>(null);

  const decodedUrl = url ? decodeURIComponent(url as string) : '';
  const decodedTitle = title ? decodeURIComponent(title as string) : 'Preview';

  const handleOpenExternal = () => {
    if (decodedUrl) Linking.openURL(decodedUrl);
  };

  // On web platform — open in new tab
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="preview-back-btn">
            <Feather name="arrow-left" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{decodedTitle}</Text>
          <TouchableOpacity onPress={handleOpenExternal} style={styles.iconBtn} testID="preview-external-btn">
            <Feather name="external-link" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.urlBar}>
          <Feather name="globe" size={12} color={colors.textMuted} />
          <Text style={styles.urlText} numberOfLines={1}>{decodedUrl}</Text>
        </View>
        <View style={styles.webPlaceholder}>
          <View style={styles.webPlaceholderInner}>
            <Feather name="external-link" size={40} color={colors.textMuted} />
            <Text style={styles.webPlaceholderTitle}>{decodedTitle}</Text>
            <Text style={styles.webPlaceholderUrl} numberOfLines={2}>{decodedUrl}</Text>
            <TouchableOpacity
              testID="open-in-browser-btn"
              style={styles.openBtn}
              onPress={handleOpenExternal}
            >
              <Feather name="external-link" size={16} color={colors.textInverse} />
              <Text style={styles.openBtnText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Native — show embedded WebView
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="preview-back-btn">
          <Feather name="arrow-left" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{decodedTitle}</Text>
          <Text style={styles.headerUrl} numberOfLines={1}>{decodedUrl}</Text>
        </View>
        <TouchableOpacity onPress={handleOpenExternal} style={styles.iconBtn} testID="preview-external-btn">
          <Feather name="external-link" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* URL bar / progress */}
      <View style={styles.urlBar}>
        <Feather name="lock" size={12} color={colors.textMuted} />
        <Text style={styles.urlText} numberOfLines={1}>{decodedUrl}</Text>
        {loading && <ActivityIndicator size="small" color={colors.lime} style={{ marginLeft: 8 }} />}
      </View>

      {/* Error state */}
      {error ? (
        <View style={styles.errorState}>
          <Feather name="alert-circle" size={36} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Couldn't load preview</Text>
          <Text style={styles.errorDesc}>
            This site may block embedded previews. Open it in your browser.
          </Text>
          <TouchableOpacity testID="open-in-browser-btn" style={styles.openBtn} onPress={handleOpenExternal}>
            <Feather name="external-link" size={16} color={colors.textInverse} />
            <Text style={styles.openBtnText}>Open in Browser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.lime} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          )}
          <WebView
            ref={webViewRef}
            source={{ uri: decodedUrl }}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            onHttpError={(e: any) => {
              if (e.nativeEvent.statusCode >= 400) {
                setLoading(false);
                setError(true);
              }
            }}
            onNavigationStateChange={(state: any) => {
              setCanGoBack(state.canGoBack);
              setCanGoForward(state.canGoForward);
            }}
            style={[styles.webView, loading && { opacity: 0 }]}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            allowsBackForwardNavigationGestures
            userAgent="Mozilla/5.0 (compatible; RefBoard/1.0)"
          />
        </View>
      )}

      {/* Bottom nav controls (native only) */}
      {!error && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            testID="preview-back-page-btn"
            style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
            onPress={() => webViewRef.current?.goBack()}
            disabled={!canGoBack}
          >
            <Feather name="chevron-left" size={22} color={canGoBack ? colors.textSecondary : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="preview-forward-page-btn"
            style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
            onPress={() => webViewRef.current?.goForward()}
            disabled={!canGoForward}
          >
            <Feather name="chevron-right" size={22} color={canGoForward ? colors.textSecondary : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="preview-reload-btn"
            style={styles.navBtn}
            onPress={() => webViewRef.current?.reload()}
          >
            <Feather name="refresh-cw" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity testID="preview-share-btn" style={styles.navBtn} onPress={handleOpenExternal}>
            <Feather name="external-link" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  iconBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerUrl: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 6,
  },
  urlText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    zIndex: 10,
    gap: 12,
  },
  loadingText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted },
  webView: { flex: 1, backgroundColor: colors.bg },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 16,
  },
  errorTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.textSecondary },
  errorDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lime,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
    marginTop: 8,
  },
  openBtnText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.textInverse },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  navBtn: { padding: 10 },
  navBtnDisabled: { opacity: 0.35 },
  // Web-only styles
  webPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  webPlaceholderInner: {
    alignItems: 'center',
    gap: 14,
    maxWidth: 400,
  },
  webPlaceholderTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  webPlaceholderUrl: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
