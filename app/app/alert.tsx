import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrashStore } from '@/stores/crash.store';
import { useContactsStore } from '@/stores/contacts.store';
import { TileMap } from '@/components/map/TileMap';
import { colors } from '@/constants/colors';
import { CRASH } from '@/constants/thresholds';

export default function CrashAlert() {
  const active = useCrashStore((s) => s.active);
  const dismiss = useCrashStore((s) => s.dismiss);
  const topContact = useContactsStore((s) => s.contacts.find((c) => c.enabled));
  const { width: winW } = useWindowDimensions();
  const [secs, setSecs] = useState<number>(CRASH.autoCallCountdownSec);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const onCancel = () => {
    dismiss();
    router.back();
  };

  const mapW = Math.min(winW - 48, 500);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.icon}>🚨</Text>
        <Text style={styles.title}>CRASH DETECTED</Text>
        <Text style={styles.subtitle}>
          Peak {active?.peakG.toFixed(1) ?? '--'}g · Severity {active?.severity ?? '--'}
        </Text>

        {active ? (
          <View style={styles.mapWrap}>
            <TileMap
              center={active.location}
              zoom={16}
              width={mapW}
              height={150}
              markers={[{ lat: active.location.lat, lng: active.location.lng, color: colors.text }]}
              rounded={16}
            />
          </View>
        ) : null}

        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>AUTO-CALL IN</Text>
          <Text style={styles.timer}>{secs}s</Text>
        </View>

        <Text style={styles.note}>
          {topContact
            ? `Calling ${topContact.name} (${topContact.phone}) unless you cancel.`
            : 'No emergency contacts set. Add one in Profile → Contacts.'}
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
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  icon: { fontSize: 64 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: 1 },
  subtitle: { color: colors.text, opacity: 0.85, fontSize: 13 },
  mapWrap: { marginTop: 16, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  timerBox: { alignItems: 'center', marginTop: 16 },
  timerLabel: { color: colors.text, opacity: 0.7, fontSize: 11, letterSpacing: 2 },
  timer: { color: colors.text, fontSize: 80, fontWeight: '200', fontVariant: ['tabular-nums'] },
  note: { color: colors.text, opacity: 0.9, fontSize: 13, textAlign: 'center', paddingHorizontal: 20, marginTop: 4 },
  cancelBtn: {
    backgroundColor: '#000',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelText: { color: colors.text, fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});
