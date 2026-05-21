import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as haptics from '@/services/haptics';
import { formatDuration, formatWhen } from '@/services/mock/trips.mock';
import { useCrashStore } from '@/stores/crash.store';
import { useTripsStore } from '@/stores/trips.store';
import { colors } from '@/constants/colors';
import type { Trip } from '@/types/trip.types';
import type { CrashEvent } from '@/types/crash.types';

function TripRow({ trip, index }: { trip: Trip; index: number }) {
  const duration = formatDuration(trip.endedAt - trip.startedAt);
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(400)}>
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
    </Animated.View>
  );
}

function CrashRow({ crash }: { crash: CrashEvent }) {
  const d = new Date(crash.timestamp);
  const when = `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return (
    <Pressable
      onPress={() => router.push(`/crash/${crash.id}`)}
      style={({ pressed }) => [styles.crashRow, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.crashIconBox}>
        <Text style={styles.icon}>💥</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.when}>{crash.severity.toUpperCase()} impact · {crash.peakG.toFixed(2)}g</Text>
        <Text style={styles.meta}>
          {when} · {crash.dismissed ? 'Dismissed' : 'Call placed'}
        </Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

export default function History() {
  const crashHistory = useCrashStore((s) => s.history);
  const trips = useTripsStore((s) => s.trips);
  const loadTrips = useTripsStore((s) => s.load);
  const loaded = useTripsStore((s) => s.loaded);
  const totalKm = trips.reduce((a, t) => a + t.distanceKm, 0);
  const totalCrashes = trips.reduce((a, t) => a + t.crashCount, 0) + crashHistory.length;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loaded) loadTrips();
  }, [loaded, loadTrips]);

  const onRefresh = async () => {
    haptics.tap();
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryGlow}
            colors={[colors.primary]}
            progressBackgroundColor={colors.bgElevated}
          />
        }
      >
        <Text style={styles.title}>🗺️ Trip History</Text>
        <Text style={styles.sub}>{trips.length} trips · all-time</Text>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.sumValue}>{totalKm.toFixed(0)}</Text>
            <Text style={styles.sumLabel}>km driven</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.summaryItem}>
            <Text style={styles.sumValue}>{trips.length}</Text>
            <Text style={styles.sumLabel}>trips</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.summaryItem}>
            <Text style={[styles.sumValue, totalCrashes > 0 && { color: colors.danger }]}>{totalCrashes}</Text>
            <Text style={styles.sumLabel}>incidents</Text>
          </View>
        </View>

        {crashHistory.length > 0 ? (
          <>
            <Text style={styles.section}>RECENT INCIDENTS</Text>
            <View style={{ gap: 10, marginBottom: 8 }}>
              {crashHistory.map((c) => (
                <CrashRow key={c.id} crash={c} />
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.section}>TRIPS</Text>
        {trips.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🛣️</Text>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptyText}>Your drives will appear here once the black box starts recording.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {trips.map((t, i) => (
              <TripRow key={t.id} trip={t} index={i} />
            ))}
          </View>
        )}
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
  section: { color: colors.textDim, fontSize: 11, letterSpacing: 1.6, fontWeight: '700', marginTop: 16, marginBottom: 10, marginLeft: 4 },
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
  crashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  crashIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 8 },
  emptyText: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
});
