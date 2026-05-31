import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOutUp } from 'react-native-reanimated';
import { useWarningsStore, type WarningType } from '@/stores/warnings.store';
import * as haptics from '@/services/haptics';
import { colors } from '@/constants/colors';

const AUTO_DISMISS_MS = 5000;

const COPY: Record<WarningType, { emoji: string; title: string; tone: string }> = {
  HARSH_BRAKE: { emoji: '🛑', title: 'Harsh braking detected',     tone: colors.danger },
  HARSH_ACCEL: { emoji: '⚡', title: 'Harsh acceleration detected', tone: colors.warning },
  OVERSPEED:   { emoji: '🚀', title: 'Over speed limit',             tone: colors.danger },
  IDLE:        { emoji: '💤', title: 'Idle / stopped',               tone: colors.textMuted },
};

export function WarningBanner() {
  const banner = useWarningsStore((s) => s.banner);
  const dismiss = useWarningsStore((s) => s.dismissBanner);
  const lastIdRef = useRef<string | null>(null);

  // Haptic + auto-dismiss when a new banner arrives.
  useEffect(() => {
    if (!banner) {
      lastIdRef.current = null;
      return;
    }
    if (banner.id === lastIdRef.current) return;
    lastIdRef.current = banner.id;
    haptics.warning();
    const t = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [banner, dismiss]);

  if (!banner) return null;

  const c = COPY[banner.type] ?? { emoji: '⚠️', title: banner.type, tone: colors.warning };

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOutUp.duration(220)}>
      <Pressable
        onPress={dismiss}
        style={[styles.banner, { borderColor: c.tone, shadowColor: c.tone }]}
      >
        <Text style={[styles.emoji, { backgroundColor: c.tone + '33' }]}>{c.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.tone }]}>WARNING</Text>
          <Text style={styles.text}>{c.title}</Text>
          {typeof banner.gForce === 'number' ? (
            <Text style={styles.sub}>Peak {banner.gForce.toFixed(2)}g · tap to dismiss</Text>
          ) : (
            <Text style={styles.sub}>Tap to dismiss</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  emoji: { fontSize: 24, width: 44, height: 44, borderRadius: 12, textAlign: 'center', lineHeight: 44 },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  text: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 2 },
  sub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
