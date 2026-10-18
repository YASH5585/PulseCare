# PulseCare — System Architecture

## 1. Overview

PulseCare is a smart cardiac health platform developed as part
of the Engineering Clinics System project.

It will provide ECG monitoring, recording management, signal
quality assessment, health journaling, analytics, and reports.

## 2. System Components

### 2.1 Hardware Layer

- ECG sensor: AD8232
- Current prototype: Arduino Uno
- Planned final controller: ESP32
- Firmware development: Arduino IDE using C/C++

### 2.2 Web Application

- React
- TypeScript
- Vite

Responsibilities:
- Display monitoring dashboards.
- Visualize ECG waveforms.
- Display available measurements.
- Manage recording history.
- Present analytics and reports.

### 2.3 Android Application

- Flutter
- Dart

Responsibilities:
- Connect to the monitoring device.
- Display live ECG data.
- Manage recording sessions.
- Synchronize recordings when supported.

### 2.4 Backend

- Python
- FastAPI

Responsibilities:
- Provide APIs to the applications.
- Validate incoming data.
- Enforce authentication and authorization.
- Manage recording metadata.
- Coordinate signal processing and reporting.

### 2.5 Database

- PostgreSQL

Responsibilities:
- Store user and device metadata.
- Store recording metadata.
- Store analysis results and associated records.
- Support historical queries.

The ECG sample-storage design will be finalized separately.

## 3. Communication

The planned system may support:

- Bluetooth communication between the ESP32 and Android app.
- Wi-Fi communication between the ESP32 and backend.

The final communication protocol and data format must be
verified against the ESP32 firmware before integration.

## 4. ECG Data Flow

1. The sensor provides an ECG signal.
2. The microcontroller acquires ECG samples.
3. Firmware processes the signal as appropriate.
4. The device transmits samples and available BPM measurements.
5. The receiving application or backend validates the data.
6. ECG samples are visualized.
7. Recordings are saved when recording is enabled.
8. Historical data supports analytics and reports.

## 5. Development Strategy

### Phase 1
Requirements and architecture documentation.

### Phase 2
Website interface using clearly identified simulated data.

### Phase 3
Backend APIs and database integration.

### Phase 4
Recording management and signal-quality assessment.

### Phase 5
ESP32 hardware integration.

### Phase 6
Analytics and report generation.

### Phase 7
Android application and advanced features.

## 6. Safety and Validation

Simulated readings must be clearly identified.

Actual ECG acquisition and heart-rate calculations must be
validated before being treated as reliable measurements.

PulseCare is an academic prototype and is not a substitute
for professional medical diagnosis.