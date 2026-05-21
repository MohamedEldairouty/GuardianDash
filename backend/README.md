# ☁️ GuardianDash Backend

Node.js + Express + SQLite. Lightweight API for accounts, contacts, trips,
saved locations, and stats. The mobile app talks to it over HTTP and falls
back to local AsyncStorage when offline.

## Run

```bash
cd backend
npm install
npm start         # http://0.0.0.0:4000
```

DB file is created automatically: `backend/guardiandash.db` (SQLite).

## Endpoints (all return JSON)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET    | `/api/v1/health`         | — | Liveness probe |
| POST   | `/api/v1/auth/register`  | — | `{ name, email, password }` → `{ token, user }` |
| POST   | `/api/v1/auth/login`     | — | `{ email, password }` → `{ token, user }` |
| GET    | `/api/v1/auth/me`        | ✓ | Current user |
| GET    | `/api/v1/contacts`       | ✓ | Emergency contacts (sorted by priority) |
| POST   | `/api/v1/contacts`       | ✓ | Create contact |
| PUT    | `/api/v1/contacts/:id`   | ✓ | Update contact |
| DELETE | `/api/v1/contacts/:id`   | ✓ | Delete contact |
| GET    | `/api/v1/trips`          | ✓ | Latest 100 trips |
| POST   | `/api/v1/trips`          | ✓ | Record a trip |
| GET    | `/api/v1/locations`      | ✓ | Saved locations (Home, Work…) |
| POST   | `/api/v1/locations`      | ✓ | Add a saved location |
| DELETE | `/api/v1/locations/:id`  | ✓ | Remove |
| GET    | `/api/v1/stats`          | ✓ | Aggregated stats: km, trips, incidents, top speed |

Auth uses a `Bearer` JWT in the `Authorization` header. Tokens last 30 days.

## Env vars

| Var | Default | Meaning |
|---|---|---|
| `GD_API_PORT` | `4000` | HTTP port |
| `GD_JWT_SECRET` | `dev-only-secret-change-me` | Override before shipping |

## Database schema

See `db.js`. Five tables: `users`, `contacts`, `trips`, `saved_locations`,
plus foreign-key cascades so deleting a user cleans up all their data.

## How it pairs with the mobile app

In the app: **Profile → API Backend** → paste `http://<laptop-ip>:4000`.
The app will use the backend when reachable and silently fall back to
local storage when not. Both stores share the same data shape.
