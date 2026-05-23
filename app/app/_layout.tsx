import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/stores/auth.store';
import { useContactsStore } from '@/stores/contacts.store';
import { useTripsStore } from '@/stores/trips.store';
import { useDeviceGPS } from '@/hooks/useDeviceGPS';
import { useCrashWatch } from '@/hooks/useCrashWatch';
import { useTripRecorder } from '@/hooks/useTripRecorder';
import { getBase } from '@/services/api';
import { colors } from '@/constants/colors';

function GlobalEffects() {
  useDeviceGPS();
  useCrashWatch();
  useTripRecorder();
  return null;
}

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const loadContacts = useContactsStore((s) => s.load);
  const clearContacts = useContactsStore((s) => s.clear);
  const loadTrips = useTripsStore((s) => s.load);
  const clearTrips = useTripsStore((s) => s.clear);
  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      loadContacts();
      loadTrips();
    } else {
      clearContacts();
      clearTrips();
    }
  }, [user, hydrated, loadContacts, clearContacts, loadTrips, clearTrips]);

  useEffect(() => {
    if (!navState?.key || !hydrated) return;
    const root = segments[0];
    const inAuth = root === '(auth)';
    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }
    if (inAuth) router.replace('/(tabs)');
  }, [user, hydrated, segments, router, navState?.key]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="trip/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="crash/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="settings/sensitivity" options={{ title: 'Crash Sensitivity', headerShown: true }} />
          <Stack.Screen name="device/ble" options={{ title: 'Pair Black Box', headerShown: true }} />
          <Stack.Screen name="contacts/index" options={{ title: 'Emergency Contacts', headerShown: true }} />
          <Stack.Screen name="contacts/edit" options={{ presentation: 'modal', title: 'Contact', headerShown: true }} />
          <Stack.Screen
            name="alert"
            options={{ presentation: 'fullScreenModal', headerShown: false, animation: 'fade' }}
          />
        </Stack>
        <AuthGate />
        <GlobalEffects />
        <HydrationOverlay />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function HydrationOverlay() {
  const hydrated = useAuthStore((s) => s.hydrated);
  if (hydrated) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      pointerEvents="auto"
    >
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
