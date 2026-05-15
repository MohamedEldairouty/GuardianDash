import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { G_FORCE } from '@/constants/thresholds';

const MAX_G = 6;

function colorFor(g: number) {
  if (g >= G_FORCE.warning) return colors.danger;
  if (g >= G_FORCE.caution) return colors.warning;
  return colors.success;
}

export function GForceBar({ gForce, peak }: { gForce: number; peak: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(1, gForce / MAX_G), { duration: 200, easing: Easing.out(Easing.quad) });
  }, [gForce, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
    backgroundColor: colorFor(gForce),
  }));

  const peakLeft = `${Math.min(100, (peak / MAX_G) * 100)}%`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>G-FORCE</Text>
        <Text style={[styles.value, { color: colorFor(gForce) }]}>
          {gForce.toFixed(2)} g
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
        <View style={[styles.zoneMark, { left: `${(G_FORCE.caution / MAX_G) * 100}%` }]} />
        <View style={[styles.zoneMark, { left: `${(G_FORCE.warning / MAX_G) * 100}%` }]} />
        {peak > 0.05 && <View style={[styles.peakMark, { left: peakLeft as any }]} />}
      </View>

      <View style={styles.scale}>
        <Text style={styles.tick}>0g</Text>
        <Text style={styles.tick}>2g</Text>
        <Text style={styles.tick}>4g</Text>
        <Text style={styles.tick}>6g+</Text>
      </View>

      <Text style={styles.peakLabel}>Peak {peak.toFixed(2)}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  label: { color: colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  value: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: {
    height: 10,
    backgroundColor: colors.surface,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 5 },
  zoneMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.bg,
    opacity: 0.7,
  },
  peakMark: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    width: 2,
    backgroundColor: colors.text,
    borderRadius: 1,
  },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  tick: { color: colors.textDim, fontSize: 9, fontWeight: '600' },
  peakLabel: { color: colors.textMuted, fontSize: 11, marginTop: 8 },
});
