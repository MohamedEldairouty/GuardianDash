import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrashStore } from '@/stores/crash.store';
import { useContactsStore } from '@/stores/contacts.store';
import { useAuthStore } from '@/stores/auth.store';
import { triggerEmergency, dial, sendSms, buildCrashSmsBody } from '@/services/emergency';
import { TileMap } from '@/components/map/TileMap';
import { colors } from '@/constants/colors';
import { CRASH } from '@/constants/thresholds';

export default function CrashAlert() {
  const active = useCrashStore((s) => s.active);
  const dismiss = useCrashStore((s) => s.dismiss);
  const contacts = useContactsStore((s) => s.contacts);
  const user = useAuthStore((s) => s.user);
  const topContact = contacts.find((c) => c.enabled);
  const { width: winW } = useWindowDimensions();
  const [secs, setSecs] = useState<number>(CRASH.autoCallCountdownSec);
  const firedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // When the countdown reaches zero, fire the real call/SMS exactly once.
  useEffect(() => {
    if (secs === 0 && !firedRef.current && active) {
      firedRef.current = true;
      triggerEmergency(contacts, active, user?.name).catch(() => {});
    }
  }, [secs, active, contacts, user?.name]);

  if (!active) {
    return null;
  }

  const onCancel = () => {
    dismiss();
    router.back();
  };

  const onCallNow = async () => {
    if (!topContact) return;
    firedRef.current = true;
    await dial(topContact.phone);
  };

  const onSmsNow = async () => {
    if (!topContact || !active) return;
    firedRef.current = true;
    await sendSms(topContact.phone, buildCrashSmsBody(active, user?.name));
  };

  const mapW = Math.min(winW - 48, 500);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.icon}>🚨</Text>
        <Text style={styles.title}>CRASH DETECTED</Text>
        <Text style={styles.subtitle}>
          Peak {active.peakG.toFixed(1)}g · Severity {active.severity}
        </Text>

        <View style={styles.mapWrap}>
          <TileMap
            center={active.location}
            zoom={16}
            width={mapW}
            height={130}
            markers={[{ lat: active.location.lat, lng: active.location.lng, color: colors.text }]}
            rounded={16}
          />
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>AUTO-CALL IN</Text>
          <Text style={styles.timer}>{secs}s</Text>
        </View>

        <Text style={styles.note}>
          {topContact
            ? `Calling ${topContact.name} (${topContact.phone}) unless you cancel.`
            : 'No emergency contacts set. Add one in Profile → Contacts.'}
        </Text>

        {topContact ? (
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={onCallNow}>
              <Text style={styles.actionEmoji}>📞</Text>
              <Text style={styles.actionLabel}>CALL NOW</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onSmsNow}>
              <Text style={styles.actionEmoji}>💬</Text>
              <Text style={styles.actionLabel}>SEND SMS</Text>
            </Pressable>
          </View>
        ) : null}
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
  icon: { fontSize: 60 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  subtitle: { color: colors.text, opacity: 0.85, fontSize: 13 },
  mapWrap: { marginTop: 12, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  timerBox: { alignItems: 'center', marginTop: 12 },
  timerLabel: { color: colors.text, opacity: 0.7, fontSize: 11, letterSpacing: 2 },
  timer: { color: colors.text, fontSize: 72, fontWeight: '200', fontVariant: ['tabular-nums'] },
  note: { color: colors.text, opacity: 0.9, fontSize: 13, textAlign: 'center', paddingHorizontal: 20, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionEmoji: { fontSize: 18 },
  actionLabel: { color: colors.text, fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  cancelBtn: {
    backgroundColor: '#000',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelText: { color: colors.text, fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});
