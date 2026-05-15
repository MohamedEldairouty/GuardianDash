import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockTrips, formatDuration, formatWhen, centerOfPath } from '@/services/mock/trips.mock';
import { TileMap } from '@/components/map/TileMap';
import { colors } from '@/constants/colors';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = mockTrips.find((t) => t.id === id);
  const { width: winW } = useWindowDimensions();
  const mapW = Math.min(winW - 40, 500);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Trip not found', headerShown: true }} />
        <Text style={styles.title}>Trip not found</Text>
      </SafeAreaView>
    );
  }

  const center = centerOfPath(trip.path);
  const start = trip.path[0];
  const end = trip.path[trip.path.length - 1];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>{formatWhen(trip.startedAt)}</Text>
          <Text style={styles.headerSub}>{formatDuration(trip.endedAt - trip.startedAt)} drive</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ alignItems: 'center' }}>
          <TileMap
            center={center}
            zoom={trip.distanceKm > 20 ? 12 : 14}
            width={mapW}
            height={260}
            path={trip.path}
            markers={[
              ...(start ? [{ lat: start.lat, lng: start.lng, color: colors.success, pulse: false }] : []),
              ...(end ? [{ lat: end.lat, lng: end.lng, color: trip.crashCount > 0 ? colors.danger : colors.primary, pulse: false }] : []),
            ]}
          />
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Start</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: trip.crashCount > 0 ? colors.danger : colors.primary }]} />
            <Text style={styles.legendText}>{trip.crashCount > 0 ? 'Crash location' : 'End'}</Text>
          </View>
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 60 },
  back: { color: colors.primaryGlow, fontSize: 14, fontWeight: '600' },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  headerSub: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', padding: 20 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontSize: 12 },
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
});
