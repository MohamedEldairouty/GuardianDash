import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockTrips, formatDuration, formatWhen } from '@/services/mock/trips.mock';
import { colors } from '@/constants/colors';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = mockTrips.find((t) => t.id === id);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Trip not found', headerShown: true }} />
        <Text style={styles.title}>Trip not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: formatWhen(trip.startedAt), headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🚗 {formatWhen(trip.startedAt)}</Text>
        <Text style={styles.sub}>{formatDuration(trip.endedAt - trip.startedAt)} drive</Text>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DISTANCE</Text>
            <Text style={styles.cardValue}>{trip.distanceKm.toFixed(1)}</Text>
            <Text style={styles.cardUnit}>km</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>MAX SPEED</Text>
            <Text style={styles.cardValue}>{trip.maxSpeedKph}</Text>
            <Text style={styles.cardUnit}>km/h</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>AVG SPEED</Text>
            <Text style={styles.cardValue}>{trip.avgSpeedKph}</Text>
            <Text style={styles.cardUnit}>km/h</Text>
          </View>
          <View style={[styles.card, trip.crashCount > 0 && { borderColor: colors.danger }]}>
            <Text style={styles.cardLabel}>INCIDENTS</Text>
            <Text style={[styles.cardValue, trip.crashCount > 0 && { color: colors.danger }]}>{trip.crashCount}</Text>
            <Text style={styles.cardUnit}>events</Text>
          </View>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🗺️</Text>
          <Text style={styles.placeholderText}>Route map + telemetry replay</Text>
          <Text style={styles.placeholderSub}>Coming in Step 3 — polyline, scrubber, charts</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  cardValue: { color: colors.text, fontSize: 32, fontWeight: '700', marginTop: 6, fontVariant: ['tabular-nums'] },
  cardUnit: { color: colors.textMuted, fontSize: 12 },
  placeholder: {
    marginTop: 24,
    height: 200,
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  placeholderEmoji: { fontSize: 40 },
  placeholderText: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 8 },
  placeholderSub: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
