import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { colors } from '@/constants/colors';

const contacts = [
  { name: 'Mom 🤍', phone: '+20 100 123 4567', priority: 1 },
  { name: 'Dad', phone: '+20 100 765 4321', priority: 2 },
  { name: 'Judy (sister)', phone: '+20 122 555 9988', priority: 3 },
];

function Row({ icon, title, sub, right }: { icon: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.icon}>{icon}</Text>
        <View>
          <Text style={styles.rowTitle}>{title}</Text>
          {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export default function Profile() {
  const [notif, setNotif] = useState(true);
  const [autoCall, setAutoCall] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarBox}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </View>
          <Text style={styles.name}>Mohamed Eldairouty</Text>
          <Text style={styles.email}>chatgptacc.nd@gmail.com</Text>
        </View>

        <Text style={styles.section}>EMERGENCY CONTACTS</Text>
        <View style={styles.card}>
          {contacts.map((c, i) => (
            <View key={c.phone}>
              <Row
                icon={`#${c.priority}`}
                title={c.name}
                sub={c.phone}
                right={<Text style={styles.chev}>›</Text>}
              />
              {i < contacts.length - 1 && <View style={styles.divider} />}
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
          <Row icon="🎚️" title="Crash sensitivity" sub="Medium — 3.5g threshold" right={<Text style={styles.chev}>›</Text>} />
        </View>

        <Text style={styles.section}>DEVICE</Text>
        <View style={styles.card}>
          <Row icon="🛰️" title="Black box #A4F1" sub="Connected · Firmware v0.1.0" right={<View style={styles.greenDot} />} />
          <View style={styles.divider} />
          <Row icon="📲" title="Pair new device" sub="Scan QR or enter ID" right={<Text style={styles.chev}>›</Text>} />
        </View>

        <Text style={styles.section}>ABOUT</Text>
        <View style={styles.card}>
          <Row icon="ℹ️" title="GuardianDash" sub="v0.1.0 · Embedded Systems Final Project" />
          <View style={styles.divider} />
          <Row icon="👥" title="Team" sub="Mohamed · Rimas · Judy · Moaz" />
        </View>

        <Text style={styles.footer}>🛡️  Drive safe.</Text>
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
  footer: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 24 },
});
