import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import type { DeviceStatus } from '@/types/telemetry.types';

const config: Record<DeviceStatus, { color: string; label: string }> = {
  connected: { color: colors.success, label: 'CONNECTED' },
  searching: { color: colors.warning, label: 'SEARCHING' },
  offline: { color: colors.danger, label: 'OFFLINE' },
};

export function StatusPill({ status }: { status: DeviceStatus }) {
  const { color, label } = config[status];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(withTiming(2.4, { duration: 1200, easing: Easing.out(Easing.ease) }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }), -1, false);
  }, [scale, opacity]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.ring, { backgroundColor: color }, ring]} />
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  ring: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
});
