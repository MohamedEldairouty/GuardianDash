import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth.store';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { LogoMark } from '@/components/ui/Logo';
import { colors } from '@/constants/colors';

export default function Register() {
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    const res = await register({ name, email, password });
    setBusy(false);
    if (res.ok) router.replace('/(tabs)');
    else setError(res.error);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          <View style={styles.heroRow}>
            <LogoMark size={56} />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.title}>Create your{`\n`}guardian account</Text>
            </View>
          </View>
          <Text style={styles.sub}>Stay protected on every drive.</Text>

          <View style={styles.card}>
            <TextField label="NAME" icon="👤" value={name} onChangeText={setName} placeholder="Mohamed Eldairouty" />
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
              placeholder="At least 4 characters"
              secureTextEntry
              error={error ?? undefined}
            />

            <PrimaryButton label="Create account" onPress={onSubmit} loading={busy} />

            <Pressable onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 14 }}>
              <Text style={styles.alt}>
                Already have an account? <Text style={{ color: colors.primaryGlow }}>Sign in</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  back: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', lineHeight: 30 },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 6, marginBottom: 24 },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alt: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});
