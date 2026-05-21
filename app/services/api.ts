/**
 * Thin HTTP client for the GuardianDash backend.
 * Falls back gracefully if the backend isn't configured — callers should
 * catch and use local storage.
 */
import { db, KEYS } from '@/services/db';

const KEY_BASE = 'gd:api-base';
const KEY_TOKEN = 'gd:api-token';

/**
 * Hard-baked backend URL via env var. Set with:
 *
 *   PowerShell: $env:EXPO_PUBLIC_API_BASE='http://192.168.1.42:4000'; npx expo start
 *   CMD:        set EXPO_PUBLIC_API_BASE=http://192.168.1.42:4000 && npx expo start
 *   .env:       EXPO_PUBLIC_API_BASE=http://192.168.1.42:4000
 *
 * When set, the app skips the in-app setup screen entirely.
 * The saved DB value (from manual setup) is used only when this is unset.
 */
const ENV_BASE: string | null = (() => {
  const raw = process.env.EXPO_PUBLIC_API_BASE;
  if (!raw) return null;
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = 'http://' + u;
  return u.replace(/\/+$/, '');
})();

let cachedBase: string | null = null;
let cachedToken: string | null = null;
let hydrated = false;

async function ensureHydrated() {
  if (hydrated) return;
  cachedBase = await db.get<string>(KEY_BASE);
  cachedToken = await db.get<string>(KEY_TOKEN);
  hydrated = true;
}

export async function getBase(): Promise<string | null> {
  // Env override always wins — built into the bundle, can't be cleared from the app.
  if (ENV_BASE) return ENV_BASE;
  await ensureHydrated();
  return cachedBase;
}

export function isEnvBase(): boolean {
  return ENV_BASE !== null;
}

function normalizeUrl(u: string): string {
  let url = u.trim();
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
  return url.replace(/\/+$/, '');
}

export async function setBase(url: string | null): Promise<void> {
  cachedBase = url ? normalizeUrl(url) : null;
  if (cachedBase) await db.set(KEY_BASE, cachedBase);
  else await db.remove(KEY_BASE);
}

export async function getToken(): Promise<string | null> {
  await ensureHydrated();
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await db.set(KEY_TOKEN, token);
  else await db.remove(KEY_TOKEN);
}

export function isConfigured(): boolean {
  return !!cachedBase;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  await ensureHydrated();
  if (!cachedBase) throw new ApiError('Backend not configured', 0);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cachedToken) headers.Authorization = `Bearer ${cachedToken}`;

  const url = `${cachedBase.replace(/\/$/, '')}/api/v1${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err: any) {
    throw new ApiError(`Network error: ${err?.message ?? 'fetch failed'}`, 0);
  }

  let json: any = null;
  try { json = await res.json(); } catch {}

  if (!res.ok) {
    throw new ApiError(json?.error || `HTTP ${res.status}`, res.status);
  }
  return json as T;
}

export const api = {
  get:  <T = any>(path: string)              => request<T>('GET',    path),
  post: <T = any>(path: string, body?: any)  => request<T>('POST',   path, body),
  put:  <T = any>(path: string, body?: any)  => request<T>('PUT',    path, body),
  del:  <T = any>(path: string)              => request<T>('DELETE', path),
  // Convenience: pings the open health endpoint without auth.
  // Returns a string error or null on success.
  health: async (url: string): Promise<boolean> => {
    return (await api.healthDetail(url)).ok;
  },
  healthDetail: async (url: string): Promise<{ ok: boolean; error?: string }> => {
    const u = normalizeUrl(url);
    if (!u) return { ok: false, error: 'Empty URL' };
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const r = await fetch(`${u}/api/v1/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
      const data = await r.json().catch(() => null);
      if (!data?.ok) return { ok: false, error: 'Unexpected response' };
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.name === 'AbortError' ? 'Timed out after 6s' : (err?.message ?? 'Network error') };
    }
  },
};
