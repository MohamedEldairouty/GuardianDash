import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth.store';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/colors';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    const res = await login({ email, password });
    setBusy(false);
    if (res.ok) router.replace('/(tabs)');
    else setError(res.error);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.logo}>🛡️</Text>
            <Text style={styles.brand}>GuardianDash</Text>
            <Text style={styles.tagline}>Smart driving. Safer lives.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome back 👋</Text>
            <Text style={styles.sub}>Sign in to keep watch over your drives.</Text>

            <View style={{ marginTop: 24 }}>
              <TextField
                label="EMAIL"
                icon="📧"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextField
                label="PASSWORD"
                icon="🔒"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                error={error ?? undefined}
              />
            </View>

            <PrimaryButton label="Sign in" onPress={onSubmit} loading={busy} />

            <View style={styles.sep}>
              <View style={styles.line} />
              <Text style={styles.or}>or</Text>
              <View style={styles.line} />
            </View>

            <Link href="/(auth)/register" asChild>
              <View>
                <PrimaryButton label="Create an account" onPress={() => router.push('/(auth)/register')} variant="ghost" />
              </View>
            </Link>
          </View>

          <Text style={styles.foot}>v0.1.0 · Embedded Systems Final Project</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 28 },
  logo: { fontSize: 56 },
  brand: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 8 },
  tagline: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  sep: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.textDim, marginHorizontal: 12, fontSize: 11, letterSpacing: 1 },
  foot: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 24 },
});
