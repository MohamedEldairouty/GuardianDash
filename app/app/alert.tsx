import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrashStore } from '@/stores/crash.store';
import { colors } from '@/constants/colors';
import { CRASH } from '@/constants/thresholds';

export default function CrashAlert() {
  const active = useCrashStore((s) => s.active);
  const dismiss = useCrashStore((s) => s.dismiss);
  const [secs, setSecs] = useState<number>(CRASH.autoCallCountdownSec);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const onCancel = () => {
    dismiss();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.icon}>🚨</Text>
        <Text style={styles.title}>CRASH DETECTED</Text>
        <Text style={styles.subtitle}>
          Peak {active?.peakG.toFixed(1) ?? '--'}g · Severity {active?.severity ?? '--'}
        </Text>

        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>AUTO-CALL IN</Text>
          <Text style={styles.timer}>{secs}s</Text>
        </View>

        <Text style={styles.note}>
          Calling Emergency Contact #1 unless you cancel. Stay calm. Help is on the way.
        </Text>
      </View>

      <Pressable style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>✕  I'M OK — CANCEL</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.danger, padding: 24, justifyContent: 'space-between' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 72, marginBottom: 8 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: 1 },
  subtitle: { color: colors.text, opacity: 0.85, fontSize: 14, marginTop: 8 },
  timerBox: { alignItems: 'center', marginTop: 48 },
  timerLabel: { color: colors.text, opacity: 0.7, fontSize: 12, letterSpacing: 2 },
  timer: { color: colors.text, fontSize: 96, fontWeight: '200', fontVariant: ['tabular-nums'] },
  note: { color: colors.text, opacity: 0.85, fontSize: 14, textAlign: 'center', marginTop: 32, paddingHorizontal: 20 },
  cancelBtn: {
    backgroundColor: '#000',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
  },
  cancelText: { color: colors.text, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});
