import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { TileMap } from '@/components/map/TileMap';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { useLiveTelemetry } from '@/hooks/useLiveTelemetry';
import { useTelemetryStore } from '@/stores/telemetry.store';
import * as haptics from '@/services/haptics';
import { colors } from '@/constants/colors';
import { G_FORCE } from '@/constants/thresholds';

const ZOOMS = [13, 15, 16, 17, 18];

export default function MapTab() {
  useLiveTelemetry();
  const frame = useTelemetryStore((s) => s.latest);
  const recent = useTelemetryStore((s) => s.recent);
  const status = useTelemetryStore((s) => s.status);
  const liveGps = useTelemetryStore((s) => s.liveGps);          // phone GPS, independent of black box
  const liveSpeedKph = useTelemetryStore((s) => s.liveSpeedKph);
  const liveHeading = useTelemetryStore((s) => s.liveHeading);
  const { width: winW, height: winH } = useWindowDimensions();
  const [zoomIdx, setZoomIdx] = useState(2);
  const [follow, setFollow] = useState(true);

  // Prefer telemetry-frame location (so the trail follows the black box if
  // someone wires GPS into the firmware later), but ALWAYS fall back to the
  // phone GPS — that's what the user expects to see.
  const currentLoc = frame?.location ?? liveGps;
  const mapH = winH - 64; // minus tab bar
  const center = follow && currentLoc
    ? currentLoc
    : recent[Math.floor(recent.length / 2)]?.location ?? currentLoc ?? { lat: 30.0444, lng: 31.2357 };

  const gColor =
    !frame ? colors.textDim
      : frame.gForce >= G_FORCE.warning ? colors.danger
      : frame.gForce >= G_FORCE.caution ? colors.warning
      : colors.success;

  const zoomIn = () => { haptics.tap(); setZoomIdx((i) => Math.min(ZOOMS.length - 1, i + 1)); };
  const zoomOut = () => { haptics.tap(); setZoomIdx((i) => Math.max(0, i - 1)); };
  const recenter = () => { haptics.tap(); setFollow(true); };

  return (
    <View style={styles.container}>
      <TileMap
        center={center}
        zoom={ZOOMS[zoomIdx]}
        width={winW}
        height={mapH}
        path={recent.map((f) => f.location)}
        markers={currentLoc ? [{ lat: currentLoc.lat, lng: currentLoc.lng, color: colors.primary }] : []}
        rounded={0}
      />

      {/* Top overlay */}
      <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
        <Animated.View entering={FadeInDown.springify()} style={styles.topRow}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>📍 Live Map</Text>
            <Text style={styles.sub}>{currentLoc ? `${currentLoc.lat.toFixed(4)}, ${currentLoc.lng.toFixed(4)}` : 'Waiting for GPS…'}</Text>
          </View>
          <StatusPill status={status} />
        </Animated.View>
      </SafeAreaView>

      {/* Right-side controls */}
      <Animated.View entering={FadeIn.delay(150)} style={styles.controls} pointerEvents="box-none">
        <Pressable style={styles.ctrlBtn} onPress={zoomIn}>
          <Text style={styles.ctrlText}>＋</Text>
        </Pressable>
        <Pressable style={styles.ctrlBtn} onPress={zoomOut}>
          <Text style={styles.ctrlText}>−</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, follow && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={recenter}
        >
          <Text style={styles.ctrlText}>◎</Text>
        </Pressable>
      </Animated.View>

      {/* Bottom HUD */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.bottomHud} pointerEvents="box-none">
        <View style={styles.hudCard}>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>SPEED</Text>
            <Text style={styles.hudValue}>{liveSpeedKph != null ? Math.round(liveSpeedKph) : (frame ? Math.round(frame.speedKph) : '--')}</Text>
            <Text style={styles.hudUnit}>km/h</Text>
          </View>
          <View style={styles.hudSep} />
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>G-FORCE</Text>
            <Text style={[styles.hudValue, { color: gColor }]}>{frame ? frame.gForce.toFixed(2) : '--'}</Text>
            <Text style={styles.hudUnit}>g</Text>
          </View>
          <View style={styles.hudSep} />
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>HEADING</Text>
            <Text style={styles.hudValue}>{liveHeading != null ? Math.round(liveHeading) : (frame ? Math.round(frame.heading) : '--')}</Text>
            <Text style={styles.hudUnit}>°</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleBox: {
    backgroundColor: 'rgba(11,15,26,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 11, marginTop: 2, fontVariant: ['tabular-nums'] },
  controls: {
    position: 'absolute',
    right: 12,
    top: '40%',
    gap: 8,
  },
  ctrlBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(18,24,38,0.9)',
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlText: { color: colors.text, fontSize: 20, fontWeight: '600' },
  bottomHud: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  hudCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18,24,38,0.92)',
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hudItem: { flex: 1, alignItems: 'center' },
  hudLabel: { color: colors.textMuted, fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  hudValue: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] },
  hudUnit: { color: colors.textMuted, fontSize: 10 },
  hudSep: { width: 1, backgroundColor: colors.border, marginVertical: 6 },
});
