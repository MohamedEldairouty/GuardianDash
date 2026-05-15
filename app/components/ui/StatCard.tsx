import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';

export function StatCard({
  label,
  value,
  unit,
  accent,
  style,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Text style={[styles.value, accent ? { color: accent } : null]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  value: { color: colors.text, fontSize: 24, fontWeight: '600', fontVariant: ['tabular-nums'] },
  unit: { color: colors.textMuted, fontSize: 12, marginLeft: 4 },
});
