import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useContactsStore } from '@/stores/contacts.store';
import { useSettingsStore } from '@/stores/settings.store';
import { colors } from '@/constants/colors';

function Row({
  icon,
  title,
  sub,
  right,
  onPress,
}: {
  icon: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && onPress ? { opacity: 0.6 } : null]}>
      <View style={styles.rowLeft}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
        </View>
      </View>
      {right}
    </Pressable>
  );
}

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const contacts = useContactsStore((s) => s.contacts);
  const sensitivity = useSettingsStore((s) => s.sensitivity);
  const threshold = useSettingsStore((s) => s.threshold);
  const loadSettings = useSettingsStore((s) => s.load);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const [notif, setNotif] = useState(true);
  const [autoCall, setAutoCall] = useState(true);

  useEffect(() => {
    if (!settingsLoaded) loadSettings();
  }, [settingsLoaded, loadSettings]);

  const initial = user?.name.charAt(0).toUpperCase() ?? '?';
  const enabledContacts = contacts.filter((c) => c.enabled).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarBox}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? 'Guest'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
        </View>

        <Text style={styles.section}>EMERGENCY CONTACTS</Text>
        <View style={styles.card}>
          <Row
            icon="📞"
            title="Manage contacts"
            sub={`${enabledContacts} active · ${contacts.length} total`}
            right={<Text style={styles.chev}>›</Text>}
            onPress={() => router.push('/contacts')}
          />
          {contacts.slice(0, 3).map((c, i) => (
            <View key={c.id}>
              <View style={styles.divider} />
              <Row
                icon={`#${c.priority}`}
                title={c.name}
                sub={`${c.relationship} · ${c.phone}`}
                right={
                  <Text style={[styles.chev, { color: c.enabled ? colors.success : colors.textDim }]}>
                    {c.enabled ? '●' : '○'}
                  </Text>
                }
                onPress={() => router.push({ pathname: '/contacts/edit', params: { id: c.id } })}
              />
            </View>
          ))}
        </View>

        <Text style={styles.section}>PROTECTION</Text>
        <View style={styles.card}>
          <Row
            icon="🔔"
            title="Push notifications"
            sub="Crash alerts and trip summaries"
            right={
              <Switch
                value={notif}
                onValueChange={setNotif}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.text}
              />
            }
          />
          <View style={styles.divider} />
          <Row
            icon="📞"
            title="Auto-call after crash"
            sub="Calls contact #1 after 30s"
            right={
              <Switch
                value={autoCall}
                onValueChange={setAutoCall}
                trackColor={{ true: colors.success, false: colors.border }}
                thumbColor={colors.text}
              />
            }
          />
          <View style={styles.divider} />
          <Row
            icon="🎚️"
            title="Crash sensitivity"
            sub={`${sensitivity[0].toUpperCase() + sensitivity.slice(1)} — ${threshold.toFixed(1)}g threshold`}
            right={<Text style={styles.chev}>›</Text>}
            onPress={() => router.push('/settings/sensitivity')}
          />
        </View>

        <Text style={styles.section}>BLACK BOX</Text>
        <View style={styles.card}>
          <Row
            icon="🛰️"
            title="Connect to Black Box"
            sub="Pair via USB-serial bridge"
            right={<Text style={styles.chev}>›</Text>}
            onPress={() => router.push('/device/connect')}
          />
          <View style={styles.divider} />
          <Row
            icon="☁️"
            title="API Backend"
            sub="Sync accounts & contacts across devices"
            right={<Text style={styles.chev}>›</Text>}
            onPress={() => router.push('/device/backend')}
          />
          <View style={styles.divider} />
          <Row icon="📟" title="Display" sub="16×2 I²C LCD · Live mirror on dashboard" />
          <View style={styles.divider} />
          <Row icon="🧭" title="Sensor" sub="MPU6050 · ±2g accel @ 0x68" />
        </View>

        <Pressable style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 32 },
  avatarBox: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: colors.text, fontSize: 32, fontWeight: '700' },
  name: { color: colors.text, fontSize: 20, fontWeight: '700' },
  email: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  section: { color: colors.textDim, fontSize: 11, letterSpacing: 1.6, fontWeight: '700', marginTop: 20, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  icon: { fontSize: 18, width: 28, textAlign: 'center' },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 56 },
  chev: { color: colors.textDim, fontSize: 22, fontWeight: '300' },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  logout: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});
