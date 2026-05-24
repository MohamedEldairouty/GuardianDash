import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTelemetryStore } from '@/stores/telemetry.store';
import { useTripRecordingStore } from '@/stores/tripRecording.store';
import * as haptics from '@/services/haptics';
import { colors } from '@/constants/colors';

const MIN_MOVING_KPH = 3; // must be moving faster than walking to start

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TripRecorder() {
  const liveSpeedKph = useTelemetryStore((s) => s.liveSpeedKph) ?? 0;
  const recording = useTripRecordingStore((s) => s.recording);
  const startedAt = useTripRecordingStore((s) => s.startedAt);
  const path = useTripRecordingStore((s) => s.path);
  const maxSpeed = useTripRecordingStore((s) => s.maxSpeedKph);
  const crashIds = useTripRecordingStore((s) => s.crashIds);
  const saving = useTripRecordingStore((s) => s.saving);
  const start = useTripRecordingStore((s) => s.start);
  const save = useTripRecordingStore((s) => s.save);
  const cancel = useTripRecordingStore((s) => s.cancel);

  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recording || !startedAt) return;
    const t = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    setElapsed(Date.now() - startedAt);
    return () => clearInterval(t);
  }, [recording, startedAt]);

  // Pulsing red dot while recording.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (recording) {
      pulse.value = withRepeat(withTiming(0.3, { duration: 800 }), -1, true);
    } else {
      pulse.value = 1;
    }
  }, [recording, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const canStart = liveSpeedKph >= MIN_MOVING_KPH;

  const onStart = () => {
    haptics.tap();
    setError(null);
    start();
  };

  const onSave = async () => {
    haptics.success();
    setError(null);
    const r = await save();
    if (!r.ok) {
      haptics.warning();
      setError(r.error ?? 'Save failed');
    }
  };

  const onCancel = () => {
    haptics.warning();
    cancel();
    setError(null);
  };

  // Not recording → show start button (disabled when not moving)
  if (!recording) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.label}>🚗 TRIP RECORDING</Text>
          <Text style={[styles.hint, canStart && { color: colors.success }]}>
            {canStart ? 'Ready' : `Move > ${MIN_MOVING_KPH} km/h to start`}
          </Text>
        </View>
        <Pressable
          style={[styles.button, !canStart && styles.buttonDisabled]}
          onPress={onStart}
          disabled={!canStart}
        >
          <Text style={styles.buttonIcon}>▶</Text>
          <Text style={styles.buttonText}>START TRIP</Text>
        </Pressable>
      </View>
    );
  }

  // Recording → show stats + save / cancel
  return (
    <View style={[styles.card, styles.cardActive]}>
      <View style={styles.header}>
        <View style={styles.recordingRow}>
          <Animated.View style={[styles.dot, pulseStyle]} />
          <Text style={styles.recordingLabel}>RECORDING</Text>
        </View>
        <Text style={styles.elapsed}>{formatDuration(elapsed)}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{path.length}</Text>
          <Text style={styles.statLabel}>POINTS</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(maxSpeed)}</Text>
          <Text style={styles.statLabel}>MAX KM/H</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, crashIds.length > 0 && { color: colors.danger }]}>
            {crashIds.length}
          </Text>
          <Text style={styles.statLabel}>CRASHES</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionBtn, styles.saveBtn, saving && { opacity: 0.5 }]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.actionText}>{saving ? 'SAVING…' : '💾  SAVE TRIP'}</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.cancelBtn]}
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={[styles.actionText, { color: colors.danger }]}>CANCEL</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: { borderColor: colors.danger },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { color: colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  hint: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonDisabled: { backgroundColor: colors.surface },
  buttonIcon: { color: colors.text, fontSize: 14 },
  buttonText: { color: colors.text, fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },
  recordingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  recordingLabel: { color: colors.danger, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  elapsed: { color: colors.text, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  stats: { flexDirection: 'row', marginVertical: 10 },
  stat: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, backgroundColor: colors.border },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.textMuted, fontSize: 9, letterSpacing: 1.4, fontWeight: '700', marginTop: 2 },
  error: { color: colors.danger, fontSize: 12, marginTop: 6, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  saveBtn: { backgroundColor: colors.success, borderColor: colors.success },
  cancelBtn: { backgroundColor: 'transparent', borderColor: colors.danger },
  actionText: { color: colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
});
