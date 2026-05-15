import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrashStore } from '@/stores/crash.store';
import { useContactsStore } from '@/stores/contacts.store';
import { TileMap } from '@/components/map/TileMap';
import { TelemetryChart } from '@/components/charts/TelemetryChart';
import { colors } from '@/constants/colors';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date} · ${time}`;
}

const SEVERITY_COLOR = {
  minor: colors.warning,
  moderate: '#F97316',
  severe: colors.danger,
} as const;

export default function CrashDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const crash = useCrashStore((s) => s.history.find((c) => c.id === id) ?? s.active);
  const topContact = useContactsStore((s) => s.contacts.find((c) => c.enabled));
  const { width: winW } = useWindowDimensions();
  const contentW = Math.min(winW - 40, 500);

  if (!crash) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Crash not found' }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundEmoji}>🔍</Text>
          <Text style={styles.notFoundText}>Crash event not found</Text>
          <Text style={styles.notFoundSub}>It may have been dismissed without saving.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const severityColor = SEVERITY_COLOR[crash.severity];
  const markerIndex = Math.floor(crash.snapshot.length / 2);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Crash Report</Text>
          <Text style={styles.headerSub}>{formatTime(crash.timestamp)}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Severity banner */}
        <View style={[styles.banner, { backgroundColor: severityColor }]}>
          <Text style={styles.bannerEmoji}>💥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{crash.severity.toUpperCase()} IMPACT</Text>
            <Text style={styles.bannerSub}>
              {crash.dismissed ? 'Dismissed by driver — no call placed' : 'Auto-call placed to emergency contact'}
            </Text>
          </View>
        </View>

        {/* Map */}
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <TileMap
            center={crash.location}
            zoom={16}
            width={contentW}
            height={200}
            markers={[{ lat: crash.location.lat, lng: crash.location.lng, color: severityColor }]}
          />
        </View>

        {/* Stat grid */}
        <View style={styles.grid}>
          <View style={[styles.card, { borderColor: severityColor }]}>
            <Text style={styles.cardLabel}>PEAK G-FORCE</Text>
            <Text style={[styles.cardValue, { color: severityColor }]}>{crash.peakG.toFixed(2)}</Text>
            <Text style={styles.cardUnit}>g</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>SEVERITY</Text>
            <Text style={[styles.cardValue, { color: severityColor, fontSize: 22 }]}>{crash.severity}</Text>
            <Text style={styles.cardUnit}>impact level</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>LATITUDE</Text>
            <Text style={[styles.cardValue, { fontSize: 18 }]}>{crash.location.lat.toFixed(5)}</Text>
            <Text style={styles.cardUnit}>°N</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>LONGITUDE</Text>
            <Text style={[styles.cardValue, { fontSize: 18 }]}>{crash.location.lng.toFixed(5)}</Text>
            <Text style={styles.cardUnit}>°E</Text>
          </View>
        </View>

        {/* Telemetry chart */}
        <Text style={styles.section}>TELEMETRY SNAPSHOT</Text>
        <Text style={styles.sectionSub}>Speed & G-force around the moment of impact</Text>
        <View style={styles.chartCard}>
          <TelemetryChart frames={crash.snapshot} width={contentW - 32} markerIndex={markerIndex} />
        </View>

        {/* Response info */}
        <Text style={styles.section}>EMERGENCY RESPONSE</Text>
        <View style={styles.respCard}>
          <View style={styles.respRow}>
            <Text style={styles.respIcon}>{crash.dismissed ? '🚫' : '📞'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.respTitle}>
                {crash.dismissed ? 'Auto-call cancelled' : 'Auto-call placed'}
              </Text>
              <Text style={styles.respSub}>
                {topContact ? `Contact: ${topContact.name} (${topContact.phone})` : 'No primary contact configured'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.respRow}>
            <Text style={styles.respIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.respTitle}>GPS coordinates shared</Text>
              <Text style={styles.respSub}>Location attached to outgoing alert</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Event ID: {crash.id}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 60 },
  back: { color: colors.primaryGlow, fontSize: 14, fontWeight: '600' },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  headerSub: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 40 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
  },
  bannerEmoji: { fontSize: 32 },
  bannerTitle: { color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  bannerSub: { color: colors.text, opacity: 0.9, fontSize: 12, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  card: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  cardValue: { color: colors.text, fontSize: 26, fontWeight: '700', marginTop: 6, fontVariant: ['tabular-nums'] },
  cardUnit: { color: colors.textMuted, fontSize: 11 },
  section: { color: colors.textDim, fontSize: 11, letterSpacing: 1.6, fontWeight: '700', marginTop: 24, marginLeft: 4 },
  sectionSub: { color: colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 10, marginLeft: 4 },
  chartCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  respCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    overflow: 'hidden',
  },
  respRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  respIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  respTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  respSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 60 },
  footer: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 24 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundEmoji: { fontSize: 48 },
  notFoundText: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 12 },
  notFoundSub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
});
