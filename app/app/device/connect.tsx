import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });
import { useTelemetryStore } from '@/stores/telemetry.store';
import { connectBridge, disconnectBridge, loadBridgeUrl, saveBridgeUrl } from '@/services/liveBridge';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import * as haptics from '@/services/haptics';
import { colors } from '@/constants/colors';

export default function DeviceConnect() {
  const connected = useTelemetryStore((s) => s.hardwareConnected);
  const latest = useTelemetryStore((s) => s.latest);
  const [url, setUrl] = useState('http://192.168.1.10:4001');

  useEffect(() => {
    loadBridgeUrl().then((u) => u && setUrl(u));
  }, []);

  const onConnect = async () => {
    haptics.tap();
    await saveBridgeUrl(url);
    connectBridge(url);
  };

  const onDisconnect = () => {
    haptics.warning();
    disconnectBridge();
    saveBridgeUrl(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🛰️</Text>
        <Text style={styles.title}>Connect to Black Box</Text>
        <Text style={styles.sub}>
          Plug the STM32 into your computer over USB and run the bridge script. Then paste the bridge URL here.
        </Text>
      </View>

      <View style={[styles.statusCard, connected ? styles.statusOk : null]}>
        <View style={[styles.statusDot, { backgroundColor: connected ? colors.success : colors.textDim }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>{connected ? 'Connected — receiving live data' : 'Not connected'}</Text>
          <Text style={styles.statusSub}>
            {connected && latest
              ? `Last G-force: ${latest.gForce.toFixed(2)}g · ${new Date(latest.timestamp).toLocaleTimeString()}`
              : 'Showing mock telemetry until hardware connects.'}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <TextField
          label="BRIDGE URL"
          icon="🌐"
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.10:4001"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {connected ? (
          <PrimaryButton label="Disconnect" variant="danger" onPress={onDisconnect} />
        ) : (
          <PrimaryButton label="Connect" onPress={onConnect} />
        )}
        <PrimaryButton label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: 10 }} />
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>How to start the bridge</Text>
        <Text style={styles.helpStep}>1. On your laptop:</Text>
        <Text style={styles.code}>cd bridge && npm install</Text>
        <Text style={styles.helpStep}>2. Find your COM port:</Text>
        <Text style={styles.code}>npm run list</Text>
        <Text style={styles.helpStep}>3. Start the bridge:</Text>
        <Text style={styles.code}>GD_SERIAL_PORT=COM3 npm start</Text>
        <Text style={styles.helpStep}>4. Paste the URL it prints (above) and tap Connect.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 20 },
  emoji: { fontSize: 44 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 8 },
  sub: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 12, lineHeight: 18 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOk: { borderColor: colors.success },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  statusSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  helpCard: {
    marginTop: 24,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  helpStep: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  code: {
    color: '#7CFFB2',
    fontSize: 12,
    fontFamily: MONO,
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
});
