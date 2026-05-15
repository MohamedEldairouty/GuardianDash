import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useContactsStore } from '@/stores/contacts.store';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { confirm } from '@/services/confirm';
import * as haptics from '@/services/haptics';
import { colors } from '@/constants/colors';
import type { Contact } from '@/types/user.types';

function ContactRow({ contact, index }: { contact: Contact; index: number }) {
  const toggle = useContactsStore((s) => s.toggle);
  const remove = useContactsStore((s) => s.remove);

  const confirmDelete = async () => {
    const ok = await confirm('Delete contact?', `Remove ${contact.name} from your emergency contacts.`, 'Delete');
    if (ok) {
      haptics.warning();
      remove(contact.id);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.row}>
      <View style={styles.priority}>
        <Text style={styles.priorityText}>{contact.priority}</Text>
      </View>
      <Pressable
        style={styles.body}
        onPress={() => router.push({ pathname: '/contacts/edit', params: { id: contact.id } })}
      >
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.meta}>
          {contact.relationship} · {contact.phone}
        </Text>
      </Pressable>
      <Switch
        value={contact.enabled}
        onValueChange={() => {
          haptics.tap();
          toggle(contact.id);
        }}
        trackColor={{ true: colors.success, false: colors.border }}
        thumbColor={colors.text}
      />
      <Pressable onPress={confirmDelete} style={styles.delete} hitSlop={8}>
        <Text style={styles.deleteText}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function ContactsList() {
  const contacts = useContactsStore((s) => s.contacts);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>
          ☎️ When a crash is detected, GuardianDash auto-calls contacts in priority order if you don't cancel within 30 seconds.
        </Text>

        <View style={{ gap: 10 }}>
          {contacts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No contacts yet</Text>
              <Text style={styles.emptySub}>Add up to 5 people we'll call in an emergency.</Text>
            </View>
          ) : (
            contacts.map((c, i) => <ContactRow key={c.id} contact={c} index={i} />)
          )}
        </View>

        <View style={{ marginTop: 24 }}>
          <PrimaryButton
            label={contacts.length >= 5 ? 'Max 5 contacts' : '+  Add contact'}
            onPress={() => router.push('/contacts/edit')}
            disabled={contacts.length >= 5}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
    padding: 14,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  priority: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  priorityText: { color: colors.text, fontWeight: '700' },
  body: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  delete: { padding: 6 },
  deleteText: { color: colors.danger, fontSize: 18, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 30 },
  emptyEmoji: { fontSize: 42 },
  emptyText: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 8 },
  emptySub: { color: colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' },
});
