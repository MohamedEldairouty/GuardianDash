/**
 * Trigger a real emergency call or SMS to a contact.
 * Uses Linking to hand off to the system dialer / messaging app — works on
 * any real Android device. On web it opens the corresponding URL handler.
 */
import { Linking, Platform } from 'react-native';
import type { Contact } from '@/types/user.types';
import type { CrashEvent } from '@/types/crash.types';

export async function dial(phone: string): Promise<boolean> {
  const url = `tel:${phone.replace(/\s/g, '')}`;
  try {
    if (Platform.OS === 'web') {
      // window.location for explicit nav; some browsers block Linking.openURL.
      if (typeof window !== 'undefined') {
        window.location.href = url;
      }
      return true;
    }
    const ok = await Linking.canOpenURL(url);
    if (!ok) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export function buildCrashSmsBody(crash: CrashEvent, userName?: string | null): string {
  const time = new Date(crash.timestamp).toLocaleTimeString();
  const maps = `https://maps.google.com/?q=${crash.location.lat},${crash.location.lng}`;
  return (
    `🚨 GuardianDash alert${userName ? ` for ${userName}` : ''}: ` +
    `possible crash at ${time}. ` +
    `Peak ${crash.peakG.toFixed(2)}g (${crash.severity}). ` +
    `Location: ${maps}`
  );
}

export async function sendSms(phone: string, body: string): Promise<boolean> {
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${phone.replace(/\s/g, '')}${separator}body=${encodeURIComponent(body)}`;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.location.href = url;
      return true;
    }
    const ok = await Linking.canOpenURL(url);
    if (!ok) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Pick the highest-priority enabled contact, place the call (preferred),
 * and ALSO open an SMS draft with the location. Both run in parallel so
 * even if the user just dials, the SMS is already composed for them.
 */
export async function triggerEmergency(
  contacts: Contact[],
  crash: CrashEvent,
  userName?: string | null,
): Promise<{ called: Contact | null; smsed: Contact | null }> {
  const sorted = contacts
    .filter((c) => c.enabled)
    .sort((a, b) => a.priority - b.priority);

  if (sorted.length === 0) return { called: null, smsed: null };

  const primary = sorted[0];
  const body = buildCrashSmsBody(crash, userName);

  // Call first (this is what takes the foreground on Android).
  const callOk = await dial(primary.phone);

  // Schedule SMS draft for the same contact slightly afterward (gives the
  // user a fallback if the call is dropped or they dismiss the dialer).
  setTimeout(() => { sendSms(primary.phone, body); }, 1500);

  return {
    called: callOk ? primary : null,
    smsed: primary,
  };
}
