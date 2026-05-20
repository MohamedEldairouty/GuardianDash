import { StyleSheet, Text, View } from 'react-native';
import { useSettingsStore } from '@/stores/settings.store';
import { colors } from '@/constants/colors';

/**
 * Mirrors the 16x2 character LCD on the STM32 black box.
 * On-device firmware writes:
 *   Line 1: "G:1.23        "
 *   Line 2: "STATUS: SAFE   " or "STATUS: UNSAFE "
 */
export function LcdMirror({ gForce }: { gForce: number }) {
  const threshold = useSettingsStore((s) => s.threshold);
  const unsafe = gForce > threshold;
  const line1 = `G:${gForce.toFixed(2).padEnd(13, ' ')}`;
  const line2 = `STATUS: ${unsafe ? 'UNSAFE' : 'SAFE  '}`.padEnd(15, ' ');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>📟  HARDWARE LCD</Text>
        <View style={[styles.power, { backgroundColor: colors.success }]} />
      </View>

      <View style={[styles.screen, unsafe && { borderColor: colors.danger }]}>
        <Text style={[styles.line, unsafe && { color: colors.danger }]}>{line1}</Text>
        <Text style={[styles.line, unsafe && { color: colors.danger }]}>{line2}</Text>
      </View>

      <Text style={styles.caption}>Mirroring the on-board 16×2 I²C LCD — trip threshold {threshold.toFixed(1)}g</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  power: { width: 8, height: 8, borderRadius: 4 },
  screen: {
    backgroundColor: '#0a3d2a',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#1f6d50',
  },
  line: {
    color: '#7CFFB2',
    fontSize: 18,
    letterSpacing: 1.5,
    fontFamily: 'Courier',
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: { color: colors.textDim, fontSize: 11, marginTop: 10, textAlign: 'center' },
});
