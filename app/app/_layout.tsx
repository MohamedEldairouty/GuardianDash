import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/stores/auth.store';
import { useContactsStore } from '@/stores/contacts.store';
import { colors } from '@/constants/colors';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const loadContacts = useContactsStore((s) => s.load);
  const clearContacts = useContactsStore((s) => s.clear);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (user) loadContacts(user.id);
    else clearContacts();
  }, [user, hydrated, loadContacts, clearContacts]);

  useEffect(() => {
    if (!navState?.key) return; // navigator not mounted yet
    if (!hydrated) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/login');
    else if (user && inAuth) router.replace('/(tabs)');
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
          <Stack.Screen name="contacts/index" options={{ title: 'Emergency Contacts', headerShown: true }} />
          <Stack.Screen name="contacts/edit" options={{ presentation: 'modal', title: 'Contact', headerShown: true }} />
          <Stack.Screen
            name="alert"
            options={{ presentation: 'fullScreenModal', headerShown: false, animation: 'fade' }}
          />
        </Stack>
        <AuthGate />
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
