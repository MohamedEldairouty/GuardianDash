import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, getBase, setBase, setToken } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import * as haptics from '@/services/haptics';
import { colors } from '@/constants/colors';

export default function BackendConnect() {
  const [url, setUrl] = useState('http://192.168.1.10:4000');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    getBase().then((b) => b && setUrl(b));
  }, []);

  const onSave = async () => {
    setBusy(true);
    setOk(null);
    const reachable = await api.health(url);
    setOk(reachable);
    if (reachable) {
      haptics.success();
      await setBase(url);
    } else {
      haptics.warning();
    }
    setBusy(false);
  };

  const onClear = async () => {
    haptics.warning();
    await setBase(null);
    await setToken(null);
    setOk(null);
    setUrl('');
    await logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>☁️</Text>
        <Text style={styles.title}>API Backend</Text>
        <Text style={styles.sub}>
          When configured, your accounts, contacts, trips and stats sync to the GuardianDash backend.
          If empty, the app uses on-device storage only.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: ok === true ? colors.success : ok === false ? colors.danger : colors.textDim },
          ]}
        />
        <Text style={styles.statusText}>
          {ok === null ? 'Not tested yet' : ok ? 'Connected ✓' : 'Unreachable — falling back to local'}
        </Text>
      </View>

      <View style={{ marginTop: 16 }}>
        <TextField
          label="BACKEND URL"
          icon="🌐"
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.10:4000"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton label="Test & Save" onPress={onSave} loading={busy} />
        <PrimaryButton label="Clear backend (use local only)" variant="ghost" onPress={onClear} style={{ marginTop: 10 }} />
        <PrimaryButton label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: 10 }} />
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>How to run the backend</Text>
        <Text style={styles.helpStep}>On your laptop:</Text>
        <Text style={styles.code}>cd backend{'\n'}npm install{'\n'}npm start</Text>
        <Text style={styles.helpStep}>Then paste:</Text>
        <Text style={styles.code}>http://&lt;laptop-ip&gt;:4000</Text>
        <Text style={styles.helpStep}>Find your laptop IP with{' '}<Text style={styles.codeInline}>ipconfig</Text> (Windows) or <Text style={styles.codeInline}>ifconfig</Text> (Mac/Linux).</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 16 },
  emoji: { fontSize: 44 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 8 },
  sub: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 12, lineHeight: 18 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  helpCard: {
    marginTop: 24,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  helpStep: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  code: { color: '#7CFFB2', fontSize: 12, backgroundColor: colors.surface, padding: 8, borderRadius: 6, marginTop: 4 },
  codeInline: { color: '#7CFFB2' },
});
