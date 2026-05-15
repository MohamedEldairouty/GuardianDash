import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '@/constants/colors';

interface Props extends TextInputProps {
  label: string;
  icon?: string;
  error?: string;
}

export function TextField({ label, icon, error, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused ? { borderColor: colors.primary } : null,
          error ? { borderColor: colors.danger } : null,
        ]}
      >
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={colors.textDim}
          style={[styles.input, style]}
        />
      </View>
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 50,
  },
  icon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0 },
  errText: { color: colors.danger, fontSize: 12, marginTop: 4, marginLeft: 4 },
});
