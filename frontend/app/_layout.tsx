import {
  useFonts,
  Syne_400Regular,
  Syne_600SemiBold,
  Syne_700Bold,
} from '@expo-google-fonts/syne';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../src/context/AppContext';
import { colors, fonts } from '../src/constants/theme';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, sessionLoaded } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoaded) return;

    const inAuthGroup = segments[0] === 'login';
    
    if (!session && !inAuthGroup) {
      // Not logged in, redirect to login
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Logged in but on login page, redirect to home
      router.replace('/(tabs)');
    }
  }, [session, sessionLoaded, segments]);

  if (!sessionLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.lime} />
        <Text style={styles.loadingText}>Loading RefBoard...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="preview"
          options={{
            headerShown: false,
            presentation: 'modal',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="ref-detail"
          options={{
            headerShown: false,
            presentation: 'card',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="team-setup"
          options={{
            headerShown: false,
            presentation: 'modal',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </AuthGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Syne_400Regular,
    Syne_600SemiBold,
    Syne_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <RootLayoutNav />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
  },
});
