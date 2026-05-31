import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTelemetryStore } from '@/stores/telemetry.store';
import { useWarningsStore } from '@/stores/warnings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { LiveChart } from '@/components/charts/LiveChart';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { colors } from '@/constants/colors';

export default function SignalsTab() {
  const recent = useTelemetryStore((s) => s.recent);
  const latest = useTelemetryStore((s) => s.latest);
  const status = useTelemetryStore((s) => s.status);
  const threshold = useSettingsStore((s) => s.threshold);
  const warnings = useWarningsStore((s) => s.history);

  // Pre-slice every series once instead of letting each chart re-derive.
  const series = useMemo(() => {
    return {
      gForce: recent.map((f) => f.gForce),
      ax: recent.map((f) => f.accel.x),
      ay: recent.map((f) => f.accel.y),
      az: recent.map((f) => f.accel.z),
      pwm: recent.map((f) => f.pwm ?? 0),
      pulse: recent.map((f) => f.pulseCount ?? 0),
    };
  }, [recent]);

  // Convert cumulative pulse count into a rate (pulses per sample).
  const pulseRate = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i < series.pulse.length; i++) {
      out.push(Math.max(0, series.pulse[i] - series.pulse[i - 1]));
    }
    return out;
  }, [series.pulse]);

  const hasData = recent.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📊 Live Signals</Text>
          <Text style={styles.sub}>
            {hasData ? `${recent.length} samples · ${warnings.length} warnings` : 'Waiting for telemetry'}
          </Text>
        </View>
        <StatusPill status={status} />
      </View>

      {!hasData ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📡</Text>
          <Text style={styles.emptyTitle}>No signals yet</Text>
          <Text style={styles.emptyText}>
            Pair the Vehicle_BlackBox to start streaming live IMU + Hall sensor data here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <LiveChart
              title="G-force"
              subtitle="Total acceleration magnitude from MPU6050"
              unit="g"
              series={[{ label: 'G', color: colors.primaryGlow, values: series.gForce }]}
              min={0.5}
              max={Math.max(3, threshold + 1)}
              reference={{ value: threshold, color: colors.danger, label: 'threshold' }}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(400)}>
            <LiveChart
              title="Accelerometer X / Y / Z"
              subtitle="Per-axis acceleration in g"
              unit="g"
              series={[
                { label: 'X', color: '#F87171', values: series.ax },
                { label: 'Y', color: '#34D399', values: series.ay },
                { label: 'Z', color: '#60A5FA', values: series.az },
              ]}
              min={-1.5}
              max={1.8}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
            <LiveChart
              title="Motor PWM"
              subtitle="Throttle from the firmware demo loop (0–100)"
              unit=""
              series={[{ label: 'PWM', color: '#FBBF24', values: series.pwm }]}
              min={0}
              max={100}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <LiveChart
              title="Hall pulse rate"
              subtitle="Wheel rotation pulses between samples"
              unit="p"
              series={[{ label: 'pulses', color: '#A78BFA', values: pulseRate }]}
              min={0}
              max={Math.max(3, Math.max(...pulseRate, 1) + 1)}
            />
          </Animated.View>

          {/* Snapshot of the latest values, like an instrument readout. */}
          {latest && (
            <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.snapshot}>
              <Text style={styles.snapshotLabel}>LATEST FRAME</Text>
              <View style={styles.snapshotGrid}>
                <Cell label="EVENT" value={latest.event ?? '—'} />
                <Cell label="ALERT" value={latest.alert ?? 'NONE'} />
                <Cell label="HALL"  value={latest.hallState != null ? String(latest.hallState) : '—'} />
                <Cell label="PULSE" value={latest.pulseCount != null ? String(latest.pulseCount) : '—'} />
              </View>
            </Animated.View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  scroll: { padding: 20, paddingTop: 8, paddingBottom: 32, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptyText: { color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19, paddingHorizontal: 20 },
  snapshot: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  snapshotLabel: { color: colors.textMuted, fontSize: 11, letterSpacing: 1.6, fontWeight: '800' },
  snapshotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  cell: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10 },
  cellLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  cellValue: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] },
});
