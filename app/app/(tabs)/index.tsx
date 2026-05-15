import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLiveTelemetry } from '@/hooks/useLiveTelemetry';
import { useTelemetryStore } from '@/stores/telemetry.store';
import { useCrashStore } from '@/stores/crash.store';
import { useAuthStore } from '@/stores/auth.store';
import { LogoMark } from '@/components/ui/Logo';
import { buildMockCrash } from '@/services/mock/crash.mock';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SpeedGauge } from '@/components/dashboard/SpeedGauge';
import { GForceBar } from '@/components/dashboard/GForceBar';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { StatCard } from '@/components/ui/StatCard';
import * as haptics from '@/services/haptics';
import { colors } from '@/constants/colors';

export default function Dashboard() {
  useLiveTelemetry();
  const frame = useTelemetryStore((s) => s.latest);
  const recent = useTelemetryStore((s) => s.recent);
  const status = useTelemetryStore((s) => s.status);
  const peakG = useTelemetryStore((s) => s.peakGRecent);
  const resetPeak = useTelemetryStore((s) => s.resetPeak);
  const trigger = useCrashStore((s) => s.trigger);
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name.split(' ')[0] ?? 'driver';

  const simulateCrash = () => {
    haptics.crash();
    const loc = frame?.location ?? { lat: 30.0444, lng: 31.2357 };
    trigger(buildMockCrash(loc), recent);
    router.push('/alert');
  };

  const onResetPeak = () => {
    haptics.tap();
    resetPeak();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <LogoMark size={40} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.brand}>
                <Text style={{ color: colors.text }}>Guardian</Text>
                <Text style={{ color: colors.primaryGlow }}>Dash</Text>
              </Text>
              <Text style={styles.greeting}>Drive safe, {firstName}</Text>
            </View>
          </View>
          <StatusPill status={status} />
        </View>

        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.gaugeWrap}>
          <SpeedGauge speedKph={frame?.speedKph ?? 0} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(500).springify()}>
          <GForceBar gForce={frame?.gForce ?? 0} peak={peakG} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(500).springify()} style={styles.row}>
          <StatCard
            label="HEADING"
            value={frame ? `${Math.round(frame.heading)}` : '--'}
            unit="°"
            style={{ marginRight: 6 }}
          />
          <StatCard
            label="ACCEL Z"
            value={frame ? frame.accel.z.toFixed(1) : '--'}
            unit="m/s²"
            style={{ marginHorizontal: 6 }}
          />
          <StatCard
            label="GYRO Z"
            value={frame ? frame.gyro.z.toFixed(0) : '--'}
            unit="°/s"
            style={{ marginLeft: 6 }}
          />
        </Animated.View>

        <Pressable style={styles.resetBtn} onPress={onResetPeak}>
          <Text style={styles.resetText}>↺  Reset peak G</Text>
        </Pressable>

        <Animated.View entering={FadeInDown.delay(200).duration(500).springify()}>
          <Pressable style={styles.crashBtn} onPress={simulateCrash}>
            <Text style={styles.crashEmoji}>💥</Text>
            <View>
              <Text style={styles.crashText}>SIMULATE CRASH</Text>
              <Text style={styles.crashSub}>Dev only — triggers full alert flow</Text>
            </View>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brand: { fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  greeting: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  gaugeWrap: { alignItems: 'center', paddingVertical: 4 },
  row: { flexDirection: 'row' },
  resetBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  crashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
    shadowColor: colors.danger,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  crashEmoji: { fontSize: 28 },
  crashText: { color: colors.text, fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  crashSub: { color: colors.text, opacity: 0.8, fontSize: 11, marginTop: 2 },
});
