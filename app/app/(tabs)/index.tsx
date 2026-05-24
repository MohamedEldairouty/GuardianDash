import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLiveTelemetry } from '@/hooks/useLiveTelemetry';
import { useTelemetryStore } from '@/stores/telemetry.store';
import { useAuthStore } from '@/stores/auth.store';
import { SpeedGauge } from '@/components/dashboard/SpeedGauge';
import { GForceBar } from '@/components/dashboard/GForceBar';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { LcdMirror } from '@/components/dashboard/LcdMirror';
import { TripRecorder } from '@/components/dashboard/TripRecorder';
import { StatCard } from '@/components/ui/StatCard';
import { LogoMark } from '@/components/ui/Logo';
import { colors } from '@/constants/colors';

export default function Dashboard() {
  useLiveTelemetry();
  const frame = useTelemetryStore((s) => s.latest);
  const status = useTelemetryStore((s) => s.status);
  const peakG = useTelemetryStore((s) => s.peakGRecent);
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name.split(' ')[0] ?? 'driver';

  const hasData = !!frame;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <LogoMark size={42} />
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

        {!hasData ? (
          <>
            <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.waitingCard}>
              <Text style={styles.waitingEmoji}>🛰️</Text>
              <Text style={styles.waitingTitle}>Waiting for Black Box</Text>
              <Text style={styles.waitingText}>
                Power on your Vehicle_BlackBox and pair it via Bluetooth.{'\n'}
                Telemetry will appear here in real time.
              </Text>
              <Pressable style={styles.pairBtn} onPress={() => router.push('/device/ble')}>
                <Text style={styles.pairBtnText}>📡  Pair Black Box</Text>
              </Pressable>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(150).duration(500).springify()}>
              <TripRecorder />
            </Animated.View>
          </>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(500).springify()}>
              <LcdMirror gForce={frame.gForce} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(500).springify()}>
              <GForceBar gForce={frame.gForce} peak={peakG} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(140).duration(500).springify()} style={styles.gaugeWrap}>
              <SpeedGauge speedKph={frame.speedKph} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.row}>
              <StatCard label="ACCEL X" value={frame.accel.x.toFixed(2)} unit="g" style={{ marginRight: 6 }} />
              <StatCard label="ACCEL Y" value={frame.accel.y.toFixed(2)} unit="g" style={{ marginHorizontal: 6 }} />
              <StatCard label="ACCEL Z" value={frame.accel.z.toFixed(2)} unit="g" style={{ marginLeft: 6 }} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(260).duration(500).springify()}>
              <TripRecorder />
            </Animated.View>
          </>
        )}
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
  waitingCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 40,
  },
  waitingEmoji: { fontSize: 56 },
  waitingTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 12 },
  waitingText: { color: colors.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 19 },
  pairBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  pairBtnText: { color: colors.text, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});
