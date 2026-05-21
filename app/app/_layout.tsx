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
import { connectBridge, loadBridgeUrl } from '@/services/liveBridge';
import { api, getBase, setBase } from '@/services/api';
import { colors } from '@/constants/colors';

function GlobalEffects() {
  useDeviceGPS();
  useEffect(() => {
    loadBridgeUrl().then((url) => { if (url) connectBridge(url); });
  }, []);
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
  const [hasBackend, setHasBackend] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const base = await getBase();
      if (!base) {
        setHasBackend(false);
        useAuthStore.setState({ hydrated: true, user: null });
        return;
      }
      // Verify it actually answers. If not, bounce back to setup so user
      // isn't trapped at the login screen.
      const reachable = await api.health(base);
      if (!reachable) {
        setHasBackend(false);
        useAuthStore.setState({ hydrated: true, user: null });
        return;
      }
      setHasBackend(true);
      hydrate();
    })();
  }, [hydrate]);

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
    if (!navState?.key || hasBackend === null || !hydrated) return;
    const root = segments[0];
    const inSetup = root === '(setup)';
    const inAuth = root === '(auth)';

    if (!hasBackend) {
      if (!inSetup) router.replace('/(setup)/backend');
      return;
    }
    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }
    if (inAuth || inSetup) router.replace('/(tabs)');
  }, [user, hydrated, hasBackend, segments, router, navState?.key]);

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
          <Stack.Screen name="(setup)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="trip/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="crash/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="settings/sensitivity" options={{ title: 'Crash Sensitivity', headerShown: true }} />
          <Stack.Screen name="device/connect" options={{ title: 'Black Box', headerShown: true }} />
          <Stack.Screen name="device/backend" options={{ title: 'API Backend', headerShown: true }} />
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
