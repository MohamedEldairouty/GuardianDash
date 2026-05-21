/**
 * Small formatting helpers shared by trip history + detail screens.
 */
export function formatDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function formatWhen(ts: number): string {
  const d = new Date(ts);
  const diffH = (Date.now() - ts) / 3600_000;
  if (diffH < 24) {
    return `Today, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  if (diffH < 48) return 'Yesterday';
  return d.toLocaleDateString();
}

export function centerOfPath(path: { lat: number; lng: number }[]): { lat: number; lng: number } {
  if (!path.length) return { lat: 30.0444, lng: 31.2357 };
  const lat = path.reduce((s, p) => s + p.lat, 0) / path.length;
  const lng = path.reduce((s, p) => s + p.lng, 0) / path.length;
  return { lat, lng };
}
