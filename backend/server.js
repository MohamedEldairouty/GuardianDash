/**
 * GuardianDash backend.
 *
 * Routes (all JSON):
 *   POST   /api/v1/auth/register          { name, email, password }
 *   POST   /api/v1/auth/login             { email, password }
 *   GET    /api/v1/auth/me                (auth)
 *
 *   GET    /api/v1/contacts               (auth)
 *   POST   /api/v1/contacts               (auth)
 *   PUT    /api/v1/contacts/:id           (auth)
 *   DELETE /api/v1/contacts/:id           (auth)
 *
 *   GET    /api/v1/trips                  (auth)
 *   POST   /api/v1/trips                  (auth)
 *
 *   GET    /api/v1/locations              (auth)
 *   POST   /api/v1/locations              (auth)
 *   DELETE /api/v1/locations/:id          (auth)
 *
 *   GET    /api/v1/stats                  (auth)
 *
 *   GET    /api/v1/health                 (open)
 */
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { hash, verify, sign, requireAuth } = require('./auth');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

// --- Health ---
app.get('/api/v1/health', (req, res) => {
  res.json({ ok: true, name: 'GuardianDash backend', time: Date.now() });
});

// --- Auth ---
app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (password.length < 4) return res.status(400).json({ error: 'Password too short' });
  const e = email.trim().toLowerCase();
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(e)) return res.status(400).json({ error: 'Invalid email' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(e);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const info = db.prepare(
    'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
  ).run(name.trim(), e, hash(password), Date.now());

  const user = { id: info.lastInsertRowid, name: name.trim(), email: e };
  // Seed two starter contacts so the new account isn't empty.
  const seed = db.prepare('INSERT INTO contacts (user_id, name, phone, relationship, priority, enabled) VALUES (?,?,?,?,?,1)');
  seed.run(user.id, 'Mom', '+201001234567', 'Mother', 1);
  seed.run(user.id, 'Dad', '+201007654321', 'Father', 2);

  res.json({ token: sign(user), user });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const e = email.trim().toLowerCase();
  const row = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(e);
  if (!row) return res.status(401).json({ error: 'No account with that email' });
  if (!verify(password, row.password_hash)) return res.status(401).json({ error: 'Wrong password' });
  const user = { id: row.id, name: row.name, email: row.email };
  res.json({ token: sign(user), user });
});

app.get('/api/v1/auth/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.userId);
  if (!row) return res.status(404).json({ error: 'User gone' });
  res.json({ user: row });
});

// --- Contacts ---
app.get('/api/v1/contacts', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY priority ASC').all(req.userId);
  res.json({ contacts: rows.map(rowToContact) });
});

app.post('/api/v1/contacts', requireAuth, (req, res) => {
  const { name, phone, relationship, priority, enabled } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Missing name or phone' });
  const count = db.prepare('SELECT COUNT(*) AS n FROM contacts WHERE user_id = ?').get(req.userId).n;
  if (count >= 5) return res.status(400).json({ error: 'Max 5 contacts' });
  const info = db.prepare(
    'INSERT INTO contacts (user_id, name, phone, relationship, priority, enabled) VALUES (?,?,?,?,?,?)'
  ).run(req.userId, name, phone, relationship || 'Contact', priority || 1, enabled === false ? 0 : 1);
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(info.lastInsertRowid);
  res.json({ contact: rowToContact(row) });
});

app.put('/api/v1/contacts/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, phone, relationship, priority, enabled } = req.body || {};
  db.prepare(
    'UPDATE contacts SET name = ?, phone = ?, relationship = ?, priority = ?, enabled = ? WHERE id = ?'
  ).run(
    name ?? existing.name,
    phone ?? existing.phone,
    relationship ?? existing.relationship,
    priority ?? existing.priority,
    enabled === undefined ? existing.enabled : (enabled ? 1 : 0),
    id,
  );
  res.json({ contact: rowToContact(db.prepare('SELECT * FROM contacts WHERE id = ?').get(id)) });
});

app.delete('/api/v1/contacts/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ ok: true });
});

// --- Trips ---
app.get('/api/v1/trips', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY started_at DESC LIMIT 100').all(req.userId);
  res.json({ trips: rows.map(rowToTrip) });
});

app.post('/api/v1/trips', requireAuth, (req, res) => {
  const { startedAt, endedAt, distanceKm, maxSpeedKph, avgSpeedKph, crashCount, path } = req.body || {};
  if (!startedAt || !endedAt) return res.status(400).json({ error: 'Missing timestamps' });
  const info = db.prepare(
    `INSERT INTO trips (user_id, started_at, ended_at, distance_km, max_speed_kph, avg_speed_kph, crash_count, path_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.userId, startedAt, endedAt,
    distanceKm || 0, maxSpeedKph || 0, avgSpeedKph || 0, crashCount || 0,
    path ? JSON.stringify(path) : null,
  );
  res.json({ trip: rowToTrip(db.prepare('SELECT * FROM trips WHERE id = ?').get(info.lastInsertRowid)) });
});

// --- Saved locations (Home, Work, etc) ---
app.get('/api/v1/locations', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM saved_locations WHERE user_id = ?').all(req.userId);
  res.json({ locations: rows.map(rowToLocation) });
});

app.post('/api/v1/locations', requireAuth, (req, res) => {
  const { name, lat, lng, icon } = req.body || {};
  if (!name || typeof lat !== 'number' || typeof lng !== 'number')
    return res.status(400).json({ error: 'Missing fields' });
  const info = db.prepare(
    'INSERT INTO saved_locations (user_id, name, lat, lng, icon) VALUES (?,?,?,?,?)'
  ).run(req.userId, name, lat, lng, icon || '📍');
  const row = db.prepare('SELECT * FROM saved_locations WHERE id = ?').get(info.lastInsertRowid);
  res.json({ location: rowToLocation(row) });
});

app.delete('/api/v1/locations/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM saved_locations WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ ok: true });
});

// --- Aggregated stats ---
app.get('/api/v1/stats', requireAuth, (req, res) => {
  const totals = db.prepare(`
    SELECT
      COALESCE(COUNT(*), 0)              AS trip_count,
      COALESCE(SUM(distance_km), 0)      AS total_km,
      COALESCE(MAX(max_speed_kph), 0)    AS top_speed,
      COALESCE(SUM(crash_count), 0)      AS incidents
    FROM trips WHERE user_id = ?
  `).get(req.userId);
  res.json({ stats: totals });
});

// --- Row mappers (snake_case → camelCase) ---
function rowToContact(r) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    relationship: r.relationship,
    priority: r.priority,
    enabled: r.enabled === 1,
  };
}
function rowToTrip(r) {
  return {
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    distanceKm: r.distance_km,
    maxSpeedKph: r.max_speed_kph,
    avgSpeedKph: r.avg_speed_kph,
    crashCount: r.crash_count,
    path: r.path_json ? JSON.parse(r.path_json) : [],
  };
}
function rowToLocation(r) {
  return { id: r.id, name: r.name, lat: r.lat, lng: r.lng, icon: r.icon };
}

// --- Boot ---
const PORT = parseInt(process.env.GD_API_PORT || '4000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[api] GuardianDash backend on http://0.0.0.0:${PORT}`);
  console.log(`[api] DB file: ${require('path').join(__dirname, 'guardiandash.db')}`);
});
