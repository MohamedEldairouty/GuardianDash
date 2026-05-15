import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLiveTelemetry } from '@/hooks/useLiveTelemetry';
import { useTelemetryStore } from '@/stores/telemetry.store';
import { useCrashStore } from '@/stores/crash.store';
import { buildMockCrash } from '@/services/mock/crash.mock';
import { colors } from '@/constants/colors';
import { G_FORCE } from '@/constants/thresholds';

export default function Dashboard() {
  useLiveTelemetry();
  const frame = useTelemetryStore((s) => s.latest);
  const status = useTelemetryStore((s) => s.status);
  const trigger = useCrashStore((s) => s.trigger);

  const gColor =
    !frame ? colors.textDim
      : frame.gForce >= G_FORCE.warning ? colors.danger
      : frame.gForce >= G_FORCE.caution ? colors.warning
      : colors.success;

  const simulateCrash = () => {
    const loc = frame?.location ?? { lat: 30.0444, lng: 31.2357 };
    trigger(buildMockCrash(loc));
    router.push('/alert');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🛡️ GuardianDash</Text>
          <Text style={styles.subtitle}>Live Dashboard</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: status === 'connected' ? colors.success : colors.warning }]} />
      </View>

      <View style={styles.gaugeCard}>
        <Text style={styles.cardLabel}>SPEED</Text>
        <Text style={styles.gaugeValue}>{frame ? Math.round(frame.speedKph) : '--'}</Text>
        <Text style={styles.gaugeUnit}>km/h</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.smallCard, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.cardLabel}>G-FORCE</Text>
          <Text style={[styles.smallValue, { color: gColor }]}>{frame ? frame.gForce.toFixed(2) : '--'} g</Text>
        </View>
        <View style={[styles.smallCard, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.cardLabel}>HEADING</Text>
          <Text style={styles.smallValue}>{frame ? `${Math.round(frame.heading)}°` : '--'}</Text>
        </View>
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.cardLabel}>📍 LOCATION</Text>
        <Text style={styles.locText}>
          {frame ? `${frame.location.lat.toFixed(5)}, ${frame.location.lng.toFixed(5)}` : 'Waiting for GPS…'}
        </Text>
      </View>

      <Pressable style={styles.simulateBtn} onPress={simulateCrash}>
        <Text style={styles.simulateText}>💥 Simulate Crash (dev)</Text>
      </Pressable>

      <Text style={styles.footer}>Step 1 complete — scaffold running. Screens build next.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  gaugeCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardLabel: { color: colors.textMuted, fontSize: 11, letterSpacing: 1.5, fontWeight: '600' },
  gaugeValue: { color: colors.text, fontSize: 80, fontWeight: '200', marginTop: 4 },
  gaugeUnit: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', marginBottom: 16 },
  smallCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallValue: { color: colors.text, fontSize: 28, fontWeight: '600', marginTop: 6 },
  locationCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  locText: { color: colors.text, fontSize: 15, marginTop: 6, fontVariant: ['tabular-nums'] },
  simulateBtn: {
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  simulateText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  footer: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 'auto', paddingBottom: 12 },
});
