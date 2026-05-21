# 📦 Building the GuardianDash Android APK

The mobile app ships as a real native Android app — no Expo Go required.
This document covers building an installable `.apk` via **EAS Build** (cloud).

## Prerequisites
- An [Expo account](https://expo.dev/signup) (free)
- Node.js installed locally

## One-time setup

```bash
cd app
npm install -g eas-cli
eas login           # use your Expo account
```

The repo already includes `eas.json` with a `preview` profile that
produces an installable `.apk` (not a Play-Store `.aab`).

## Build

```bash
eas build --platform android --profile preview
```

EAS asks 2-3 questions on the first build:
- "Generate a new Android Keystore?" → **Yes** (it stores it for you, you'll never need to touch it again)
- "Which credentials source?" → **Remote**

Wait ~15 minutes. EAS will print a download URL like:

```
✔ Build finished
📱 Android app: https://expo.dev/artifacts/eas/abc123.apk
```

Open that URL in your phone's browser → tap to download → tap to install
(Android will ask "Install from unknown sources?" — allow it once).

## Configuring the app to talk to your backend / bridge

After install, on first launch:

1. **Register** an account (it'll register against on-device storage by default)
2. Go to **Profile → API Backend** → paste your backend URL
   (e.g. `http://192.168.1.42:4000`) → **Test & Save**
3. The app now reads/writes through the backend; data syncs across devices.

For the hardware bridge:
1. Run `bridge/npm start` on the laptop with the STM32 plugged in
2. **Profile → Connect to Black Box** → paste `http://192.168.1.42:4001`
3. The dashboard LCD mirror starts showing real sensor data.

## Updating after code changes

Each time you change the app code:

```bash
eas build --platform android --profile preview
```

Re-download the new `.apk` and reinstall. No need to uninstall first —
Android will upgrade in place.

## Free tier limits

EAS free tier: **30 builds/month**. Plenty for a school project.

## Troubleshooting

- **Build fails with "Java heap space"** → re-run, EAS provisions more memory next time
- **APK installs but crashes on launch** → check `eas build:view` for the build log; usually a missing native module
- **Can't connect to backend on phone** → both devices must be on the same Wi-Fi, and Windows Firewall must allow Node.js
