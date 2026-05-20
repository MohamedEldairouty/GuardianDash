<p align="center">
  <img src="assets/logo/logo.png" alt="GuardianDash Logo" width="240"/>
</p>

<h1 align="center">🛡️ GuardianDash — Your Vehicle's Black Box & Guardian Angel</h1>

<p align="center">
  🚗 Crash Detection • 📡 Real-Time Telemetry • 🚨 Auto Emergency Call • 📱 Beautiful Mobile App
  <br/>
  🎓 <em>Academic Project — Embedded Systems Course</em>
</p>

---

> 📑 [**View Project Report (PDF)**](docs/GuardianDash_Report.pdf) *(coming soon)*

## 🧠 Overview

**GuardianDash** is a smart vehicle **black box** that watches over you on every drive.

A small device inside your car continuously logs **speed, orientation, and G-force** using an IMU sensor. The moment it detects a collision, it captures a **snapshot of the crash**, fires an instant alert to your phone, and **auto-calls your emergency contacts** — all in seconds.

Drive with peace of mind. **GuardianDash has your back.** 💪

---

## ✨ Key Features

### 📱 The Mobile App
- 🎛 **Live dashboard** — real-time speed, G-force gauge, GPS map, device status
- 🚨 **Full-screen crash alert** with 30-second auto-call countdown
- 🗺 **Trip history & replay** — every drive, mapped and chartable
- 📞 **Emergency contacts** — up to 5 people, prioritized for rapid call-out
- ⚙️ **Smart settings** — sensitivity threshold, device pairing, notifications
- 🌗 **Dark, modern UI** built for clarity in any light

### 🛰 Real-Time Telemetry
- ⚡ Live WebSocket stream from the device
- 📊 Speed, accelerometer, gyroscope, GPS — all charted in real time
- 🔋 Device status monitoring (online / offline / battery)

### 🚨 Crash Detection & eCall
- 💥 **G-force threshold triggers** crash event automatically
- 📸 Captures pre-crash & post-crash snapshot (telemetry buffer)
- 📲 **Push notification + full-screen alert** on your phone
- ⏱ **30-second cancel window** to dismiss false positives
- 📞 **Auto-calls emergency contact #1** via Twilio if not cancelled
- 📍 Sends GPS coordinates to emergency services

### 🔌 Hardware Black Box
- **STM32F401** microcontroller running custom firmware
- **MPU6050** IMU over I²C — reads accel X/Y/Z at ±2g range
- **16×2 I²C LCD** showing live `G:1.23` + `STATUS: SAFE / UNSAFE`
- Crash threshold: **G > 1.50g** (configurable in the mobile app)
- The mobile app's dashboard includes a **live LCD mirror** of the on-board display

---

## 📷 The App in Action

### 🎮 App Demo

> ▶️ *Demo video coming soon*

### 🖼 Screenshots

<p align="center">
  <em>📸 Screenshots coming soon — dashboard, crash alert, trip replay</em>
</p>

### 🦾 The Hardware

<p align="center">
  <em>📸 Hardware photo coming soon</em>
</p>

---

## 🏗 System Architecture

```
       ┌──────────────────────────┐
       │   🚗 Vehicle_BlackBox    │
       │   STM32F401 firmware     │
       │   • MPU6050 @ I²C 0x68   │
       │   • G = √(Ax² + Ay² + Az²)│
       │   • 16×2 LCD readout      │
       └───────────┬──────────────┘
                   │ telemetry stream (UART → bridge → WebSocket)
                   ▼
       ┌──────────────────────────┐
       │  📱 GuardianDash App     │
       │  React Native + Expo     │
       │  • Live LCD mirror       │
       │  • G-force bar + chart   │
       │  • Crash alert + eCall   │
       │  • Trip history & map    │
       │  • Emergency contacts    │
       └──────────────────────────┘
```

---

## 📂 Repository Structure

```
GuardianDash/
├── app/                   # 📱 Mobile app (React Native + Expo + TypeScript)
│   ├── app/               #    Expo Router screens
│   ├── components/        #    UI, dashboard, map, charts, emergency
│   ├── services/          #    API, socket, mock data, notifications
│   ├── stores/            #    Zustand state stores
│   ├── hooks/             #    Custom React hooks
│   ├── constants/         #    Thresholds, colors, design tokens
│   └── types/             #    Shared TypeScript types
│
├── backend/               # ☁️  Node.js + TypeScript API + WebSocket server
│
├── hardware/              # 🔌 STM32 firmware + schematics
│   ├── stm32/             #    Embedded C / HAL code
│   └── schematics/        #    Circuit diagrams, PCB
│
├── docs/                  # 📑 Project report, diagrams, presentation
│
└── assets/                # 🎨 Logo, screenshots, hardware photos
    ├── logo/
    ├── screenshots/
    └── hardware/
```

---

## 🚀 How to Run the Mobile App

### 1️⃣ Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your phone (iOS / Android)

### 2️⃣ Install & Start

```bash
git clone https://github.com/<MohamedEldairouty>/GuardianDash.git
cd GuardianDash/app
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone. You're in. 🚀

### 3️⃣ Try It Without Hardware

GuardianDash ships with a **mock telemetry service** — fake but realistic sensor data streams into the dashboard so you can demo and test every screen, including the **crash alert**, with zero hardware.

Hit the **"Simulate Crash"** button (dev mode) on the dashboard to fire the full crash flow end-to-end.

---

## 🛠 Technologies Used

| Layer | Tools |
|---|---|
| **Mobile App** | React Native, Expo, TypeScript, Expo Router |
| **State** | Zustand, React Query |
| **UI / Maps / Charts** | React Native Maps, Victory Native, Reanimated |
| **Real-time** | Socket.io client |
| **Backend** | Node.js, TypeScript, Express, Socket.io |
| **Database** | TimescaleDB (time-series telemetry) |
| **Notifications** | Expo Notifications (FCM + APNs) |
| **Emergency Call** | Twilio (SMS + Voice) |
| **Hardware** | STM32F401, MPU6050 IMU, 16×2 I²C LCD |
| **Firmware** | C + STM32 HAL · I²C1 @ 100 kHz |

---

## 👥 Team Members

- **[@Mohamed Abdallah Eldairouty](https://github.com/MohamedEldairouty)** – 221001719
- **[@Rimas Emad](https://github.com/rimaseldib)** – 221001067
- **[@Judy Yehia](https://github.com/Judyehia)** – 221000495
- **Moaz Ali** – 221001970

---

## 🎓 Academic Context

This project was developed as the **Final Project for the Embedded Systems Course**.

It demonstrates:
- 📡 Real-time sensor data acquisition (IMU, GPS)
- 🚨 Event-driven embedded logic (crash detection)
- 📱 Cross-platform mobile app development
- ☁️ Cloud backend with WebSocket streaming
- 🔔 Push notifications & telephony integration
- 🧱 End-to-end system design — sensor to phone

---

<p align="center">
  🛡️ <strong>GuardianDash</strong> — Smart Driving. Safer Lives.
</p>
