import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSettingsStore, type Sensitivity } from '@/stores/settings.store';
import { colors } from '@/constants/colors';

const OPTIONS: { value: Sensitivity; label: string; threshold: string; desc: string; emoji: string }[] = [
  {
    value: 'low',
    label: 'Low',
    threshold: '2.0g',
    desc: 'Fewer false alarms. Best for rough roads.',
    emoji: '🛡️',
  },
  {
    value: 'medium',
    label: 'Medium',
    threshold: '1.5g',
    desc: 'Default firmware threshold. Catches real crashes without nuisance trips.',
    emoji: '⚖️',
  },
  {
    value: 'high',
    label: 'High',
    threshold: '1.2g',
    desc: 'Maximum sensitivity. May trigger on hard braking.',
    emoji: '⚡',
  },
];

export default function SensitivityScreen() {
  const sensitivity = useSettingsStore((s) => s.sensitivity);
  const threshold = useSettingsStore((s) => s.threshold);
  const setSensitivity = useSettingsStore((s) => s.setSensitivity);
  const load = useSettingsStore((s) => s.load);
  const loaded = useSettingsStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🎚️</Text>
        <Text style={styles.title}>Crash Sensitivity</Text>
        <Text style={styles.sub}>
          Adjust how strong an impact must be before GuardianDash triggers the emergency flow.
        </Text>
        <View style={styles.thresholdBadge}>
          <Text style={styles.thresholdLabel}>CURRENT THRESHOLD</Text>
          <Text style={styles.thresholdValue}>{threshold.toFixed(1)}g</Text>
        </View>
      </View>

      <View style={{ gap: 12, marginTop: 8 }}>
        {OPTIONS.map((o) => {
          const active = sensitivity === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => setSensitivity(o.value)}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.optEmoji}>{o.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.optRow}>
                  <Text style={[styles.optLabel, active && { color: colors.primaryGlow }]}>{o.label}</Text>
                  <Text style={styles.optThreshold}>{o.threshold}</Text>
                </View>
                <Text style={styles.optDesc}>{o.desc}</Text>
              </View>
              {active ? (
                <View style={styles.check}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              ) : (
                <View style={styles.radio} />
              )}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.note}>
        ℹ️  The threshold is the peak G-force needed to declare a crash. Higher numbers = less sensitive.
        Most production black-boxes use 3–4g.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 24 },
  heroEmoji: { fontSize: 44 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 8 },
  sub: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 20, lineHeight: 18 },
  thresholdBadge: {
    marginTop: 18,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  thresholdLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  thresholdValue: { color: colors.primaryGlow, fontSize: 28, fontWeight: '800', marginTop: 2, fontVariant: ['tabular-nums'] },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: '#13203A' },
  optEmoji: { fontSize: 28 },
  optRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  optLabel: { color: colors.text, fontSize: 17, fontWeight: '700' },
  optThreshold: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  optDesc: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  check: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: colors.text, fontWeight: '800' },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.border },
  note: { color: colors.textMuted, fontSize: 12, marginTop: 24, lineHeight: 18, padding: 14, backgroundColor: colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
});
