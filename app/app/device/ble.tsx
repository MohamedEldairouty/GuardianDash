import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ble from '@/services/ble';
import { useTelemetryStore } from '@/stores/telemetry.store';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import * as haptics from '@/services/haptics';
import { colors } from '@/constants/colors';

interface Device extends ble.ScanResult { likelyBlackBox: boolean }

const KNOWN_NAMES = ['HMSoft', 'BT05', 'CC41-A', 'GuardianDash', 'BlackBox'];

export default function BlePair() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connected = useTelemetryStore((s) => s.hardwareConnected);
  const bytesReceived = useTelemetryStore((s) => s.bytesReceived);
  const framesParsed = useTelemetryStore((s) => s.framesParsed);
  const lastLine = useTelemetryStore((s) => s.lastLine);

  const enrich = (d: ble.ScanResult): Device => ({
    ...d,
    likelyBlackBox: KNOWN_NAMES.some((n) => d.name.toLowerCase().includes(n.toLowerCase())),
  });

  const startScan = useCallback(async () => {
    setError(null);
    setDevices([]);
    const ok = await ble.requestPermissions();
    if (!ok) {
      setError('Bluetooth permission required to scan for the Black Box.');
      return;
    }
    setScanning(true);
    const stop = ble.startScan((d) => {
      setDevices((prev) => {
        if (prev.some((x) => x.id === d.id)) return prev;
        const next = [...prev, enrich(d)];
        next.sort((a, b) => {
          if (a.likelyBlackBox !== b.likelyBlackBox) return a.likelyBlackBox ? -1 : 1;
          return (b.rssi ?? -999) - (a.rssi ?? -999);
        });
        return next;
      });
    });
    setTimeout(() => {
      stop();
      setScanning(false);
    }, 8000);
  }, []);

  useEffect(() => {
    startScan();
  }, [startScan]);

  const onConnect = async (d: Device) => {
    haptics.tap();
    setConnecting(d.id);
    setError(null);
    try {
      await ble.connect(d.id);
      haptics.success();
      router.back();
    } catch (e: any) {
      haptics.warning();
      setError(e?.message ?? 'Connection failed');
    } finally {
      setConnecting(null);
    }
  };

  const onDisconnect = async () => {
    haptics.warning();
    await ble.disconnect();
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>📡</Text>
        <Text style={styles.title}>Pair your Black Box</Text>
        <Text style={styles.sub}>
          Make sure the Vehicle_BlackBox is powered on and within range. The HM-10 module advertises itself as "HMSoft" by default.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <View style={[styles.statusDot, { backgroundColor: connected ? colors.success : colors.textDim }]} />
        <Text style={styles.statusText}>
          {connected ? `Connected: ${ble.connectedDeviceName() ?? 'unknown'}` : 'Not connected'}
        </Text>
        {connected ? (
          <Pressable onPress={onDisconnect} hitSlop={8}>
            <Text style={styles.disconnectLink}>Disconnect</Text>
          </Pressable>
        ) : null}
      </View>

      {connected ? (
        <View style={styles.diag}>
          <Text style={styles.diagLabel}>📥 LINK DIAGNOSTICS</Text>
          <View style={styles.diagRow}>
            <Text style={styles.diagItem}>{bytesReceived} bytes</Text>
            <Text style={styles.diagItem}>{framesParsed} frames parsed</Text>
          </View>
          <Text style={styles.diagSub} numberOfLines={2}>
            {lastLine ? `Last line: ${lastLine}` : 'Waiting for first line…'}
          </Text>
          {bytesReceived > 0 && framesParsed === 0 ? (
            <Text style={styles.diagError}>
              ⚠️  Receiving data but parser doesn't recognize the format. Rebuild the APK with the latest code.
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.scanRow}>
        <Text style={styles.scanLabel}>
          {scanning ? 'Scanning…' : `${devices.length} device${devices.length === 1 ? '' : 's'} found`}
        </Text>
        {scanning ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Pressable onPress={startScan}>
            <Text style={styles.rescanLink}>↺ Rescan</Text>
          </Pressable>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        ListEmptyComponent={
          !scanning ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>No devices yet</Text>
              <Text style={styles.emptySub}>Power on the Black Box and tap Rescan.</Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)}>
            <Pressable
              onPress={() => onConnect(item)}
              disabled={!!connecting}
              style={({ pressed }) => [
                styles.deviceRow,
                item.likelyBlackBox && styles.deviceRowHighlight,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.deviceEmoji}>{item.likelyBlackBox ? '🛰️' : '📶'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceMeta}>
                  {item.id} {item.rssi != null ? `· ${item.rssi} dBm` : ''}
                </Text>
              </View>
              {connecting === item.id ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.connectArrow}>›</Text>
              )}
            </Pressable>
          </Animated.View>
        )}
      />

      <View style={{ padding: 20 }}>
        <PrimaryButton label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  emoji: { fontSize: 40 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 6 },
  sub: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  statusCard: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: colors.text, fontSize: 13, fontWeight: '600', flex: 1 },
  disconnectLink: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  diag: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diagLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  diagRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  diagItem: { color: colors.text, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  diagSub: { color: colors.textMuted, fontSize: 11, marginTop: 6, fontFamily: 'monospace' },
  diagError: { color: colors.warning, fontSize: 11, marginTop: 6, fontWeight: '700' },
  scanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  scanLabel: { color: colors.textMuted, fontSize: 12, letterSpacing: 1, fontWeight: '700' },
  rescanLink: { color: colors.primaryGlow, fontSize: 13, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 12, paddingHorizontal: 20, marginBottom: 8 },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgElevated,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  deviceRowHighlight: { borderColor: colors.primary, backgroundColor: '#13203A' },
  deviceEmoji: { fontSize: 22 },
  deviceName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  deviceMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2, fontVariant: ['tabular-nums'] },
  connectArrow: { color: colors.textDim, fontSize: 22 },
  empty: { alignItems: 'center', padding: 30 },
  emptyEmoji: { fontSize: 36 },
  emptyText: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 8 },
  emptySub: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
});
