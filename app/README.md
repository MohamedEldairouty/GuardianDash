# 📱 GuardianDash Mobile App

React Native + Expo + TypeScript. Uses Expo Router for file-based navigation.

## Run

```bash
npm install
npx expo start
```

Scan the QR code in **Expo Go**. The dashboard streams **mock telemetry** so the app is fully playable without hardware. Tap **💥 Simulate Crash** to fire the full crash-alert flow.

## Folders

| Folder | Purpose |
|---|---|
| `app/` | Expo Router screens (file-based routes) |
| `components/` | Reusable UI, dashboard widgets, charts, map |
| `services/` | API client, socket manager, mock data, notifications |
| `stores/` | Zustand state stores |
| `hooks/` | Custom hooks |
| `constants/` | Design tokens, thresholds |
| `types/` | Shared TypeScript types |

## Status

- ✅ Repo + scaffold + nav shell + mock telemetry + crash-alert modal
- ⏳ Live dashboard  (gauges, charts, map)
- ⏳ Trip history + replay
- ⏳ Emergency contacts
- ⏳ Settings + device pairing
