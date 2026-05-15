import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
  style?: ViewStyle;
}) {
  const bg =
    variant === 'danger' ? colors.danger : variant === 'ghost' ? 'transparent' : colors.primary;
  const border = variant === 'ghost' ? colors.border : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === 'ghost' ? 1 : 0 },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
