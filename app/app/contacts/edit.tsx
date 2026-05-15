import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useContactsStore } from '@/stores/contacts.store';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/colors';

export default function ContactEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const contacts = useContactsStore((s) => s.contacts);
  const upsert = useContactsStore((s) => s.upsert);

  const existing = useMemo(() => contacts.find((c) => c.id === id), [contacts, id]);
  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [relationship, setRelationship] = useState(existing?.relationship ?? '');
  const [priority, setPriority] = useState(existing?.priority ?? Math.min(contacts.length + 1, 5));
  const [enabled] = useState(existing?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (!name.trim()) return setError('Name is required');
    if (!/^[+\d][\d\s()-]{6,}$/.test(phone.trim())) return setError('Invalid phone number');
    setError(null);
    await upsert({
      id: existing?.id,
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim() || 'Contact',
      priority,
      enabled,
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{existing ? 'Edit contact' : 'New contact'}</Text>
      <Text style={styles.sub}>This person will be called automatically in an emergency.</Text>

      <View style={{ marginTop: 20 }}>
        <TextField label="NAME" icon="👤" value={name} onChangeText={setName} placeholder="Mom" />
        <TextField
          label="PHONE NUMBER"
          icon="📞"
          value={phone}
          onChangeText={setPhone}
          placeholder="+201001234567"
          keyboardType="phone-pad"
        />
        <TextField
          label="RELATIONSHIP"
          icon="💞"
          value={relationship}
          onChangeText={setRelationship}
          placeholder="Mother, Spouse, Friend…"
          error={error ?? undefined}
        />

        <Text style={styles.label}>CALL PRIORITY</Text>
        <View style={styles.prioRow}>
          {[1, 2, 3, 4, 5].map((p) => (
            <PriorityChip key={p} value={p} active={priority === p} onPress={() => setPriority(p)} />
          ))}
        </View>
      </View>

      <PrimaryButton label={existing ? 'Save changes' : 'Add contact'} onPress={onSave} style={{ marginTop: 24 }} />
      <PrimaryButton label="Cancel" variant="ghost" onPress={() => router.back()} style={{ marginTop: 10 }} />
    </ScrollView>
  );
}

function PriorityChip({ value, active, onPress }: { value: number; active: boolean; onPress: () => void }) {
  return (
    <View style={[styles.chip, active && styles.chipActive]} onTouchEnd={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>#{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginTop: 6, marginBottom: 8 },
  prioRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: '700' },
  chipTextActive: { color: colors.text },
});
