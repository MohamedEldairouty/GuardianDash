import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api, getBase, setBase } from '@/services/api';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Logo } from '@/components/ui/Logo';
import * as haptics from '@/services/haptics';
import { colors } from '@/constants/colors';

export default function SetupBackend() {
  const [url, setUrl] = useState('http://192.168.1.10:4000');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBase().then((b) => { if (b) setUrl(b); });
  }, []);

  const onContinue = async () => {
    setBusy(true);
    setError(null);
    const result = await api.healthDetail(url);
    setBusy(false);
    if (!result.ok) {
      haptics.warning();
      setError(result.error ? `Couldn't reach backend: ${result.error}` : "Couldn't reach that URL.");
      return;
    }
    haptics.success();
    await setBase(url);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.hero}>
            <Logo size={120} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(500).springify()} style={styles.card}>
            <Text style={styles.title}>One-time setup ☁️</Text>
            <Text style={styles.sub}>
              GuardianDash stores your account, contacts and trips on a small backend server.
              Tell the app where to find it.
            </Text>

            <View style={{ marginTop: 20 }}>
              <TextField
                label="BACKEND URL"
                icon="🌐"
                value={url}
                onChangeText={setUrl}
                placeholder="http://192.168.1.10:4000"
                autoCapitalize="none"
                autoCorrect={false}
                error={error ?? undefined}
              />

              <PrimaryButton label="Test connection & continue" onPress={onContinue} loading={busy} />
            </View>

            <View style={styles.helpBox}>
              <Text style={styles.helpTitle}>How to run the backend</Text>
              <Text style={styles.helpStep}>1. On your laptop:</Text>
              <Text style={styles.code}>cd backend{'\n'}npm install{'\n'}npm start</Text>
              <Text style={styles.helpStep}>2. Find your laptop's local IP:</Text>
              <Text style={styles.code}>ipconfig{'   '}# Windows{'\n'}ifconfig{'   '}# Mac/Linux</Text>
              <Text style={styles.helpStep}>3. Paste{'  '}<Text style={styles.codeInline}>http://&lt;your-ip&gt;:4000</Text>{'  '}above.</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 24 },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  helpBox: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  helpStep: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  code: { color: '#7CFFB2', fontSize: 12, backgroundColor: '#0a1018', padding: 8, borderRadius: 6, marginTop: 4 },
  codeInline: { color: '#7CFFB2', fontSize: 12 },
});
