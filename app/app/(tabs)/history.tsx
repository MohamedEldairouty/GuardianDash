import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockTrips, formatDuration, formatWhen } from '@/services/mock/trips.mock';
import { colors } from '@/constants/colors';
import type { Trip } from '@/types/trip.types';

function TripRow({ trip }: { trip: Trip }) {
  const duration = formatDuration(trip.endedAt - trip.startedAt);
  return (
    <Pressable
      onPress={() => router.push(`/trip/${trip.id}`)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🚗</Text>
        </View>
        <View>
          <Text style={styles.when}>{formatWhen(trip.startedAt)}</Text>
          <Text style={styles.meta}>
            {trip.distanceKm.toFixed(1)} km · {duration} · max {trip.maxSpeedKph} km/h
          </Text>
        </View>
      </View>
      {trip.crashCount > 0 ? (
        <View style={styles.crashBadge}>
          <Text style={styles.crashBadgeText}>💥 {trip.crashCount}</Text>
        </View>
      ) : (
        <Text style={styles.chev}>›</Text>
      )}
    </Pressable>
  );
}

export default function History() {
  const totalKm = mockTrips.reduce((a, t) => a + t.distanceKm, 0);
  const totalCrashes = mockTrips.reduce((a, t) => a + t.crashCount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🗺️ Trip History</Text>
        <Text style={styles.sub}>{mockTrips.length} trips · all-time</Text>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.sumValue}>{totalKm.toFixed(0)}</Text>
            <Text style={styles.sumLabel}>km driven</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.summaryItem}>
            <Text style={styles.sumValue}>{mockTrips.length}</Text>
            <Text style={styles.sumLabel}>trips</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.summaryItem}>
            <Text style={[styles.sumValue, totalCrashes > 0 && { color: colors.danger }]}>{totalCrashes}</Text>
            <Text style={styles.sumLabel}>incidents</Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {mockTrips.map((t) => (
            <TripRow key={t.id} trip={t} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 2, marginBottom: 20 },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  sumValue: { color: colors.text, fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sumLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
  sep: { width: 1, backgroundColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  when: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  chev: { color: colors.textDim, fontSize: 24, fontWeight: '300' },
  crashBadge: {
    backgroundColor: colors.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  crashBadgeText: { color: colors.text, fontSize: 11, fontWeight: '700' },
});
