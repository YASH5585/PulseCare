# PulseCare — Software Requirements

## 1. Project Overview

PulseCare is a smart cardiac health platform developed as part
of the Engineering Clinics System (ECS) project.

The platform aims to combine ECG monitoring, recording management,
signal-quality assessment, health journaling, analytics, and
future AI-assisted ECG analysis.

## 2. Project Objectives

- Display ECG waveforms from the connected monitoring device.
- Calculate and display heart rate when reliable data is available.
- Record and store ECG sessions.
- Allow users to review historical recordings.
- Identify poor-quality or interrupted ECG signals.
- Provide historical measurement visualizations.
- Allow users to maintain a symptom journal.
- Generate downloadable ECG reports.
- Support future AI-assisted ECG analysis.

## 3. Target Users

### 3.1 Individual Users
Users who monitor their ECG and review their own recordings.

### 3.2 Authorized Healthcare Professionals
A potential future role for reviewing recordings shared with
appropriate authorization.

### 3.3 Administrators
Responsible for managing application configuration and
authorized system operations where required.

## 4. Functional Requirements

### FR-01: User Authentication
The system shall authenticate users before granting access
to their protected records.

### FR-02: Device Management
The system shall display device connection status and relevant
technical information when available.

### FR-03: Live ECG Monitoring
The system shall visualize ECG samples received from the device.

### FR-04: Heart-Rate Display
The system shall display calculated heart rate when a sufficiently
reliable measurement is available.

### FR-05: ECG Recording
The system shall allow users to start, stop, save, and retrieve
recordings.

### FR-06: Signal Quality
The system shall identify supported signal-quality problems
and communicate limitations to the user.

### FR-07: Recording History
The system shall provide access to previously saved recordings.

### FR-08: Health Journal
The system shall allow users to associate symptoms and notes
with relevant monitoring sessions.

### FR-09: Analytics
The system shall visualize historical measurements and recording
statistics.

### FR-10: Report Generation
The system shall generate reports containing available recording
information and relevant measurements.

### FR-11: Future ECG Analysis
The architecture should support integrating appropriately
evaluated ECG analysis methods in a later development phase.

## 5. Non-Functional Requirements

### Security
- Protect user accounts and medical information.
- Enforce authorization on the backend.
- Never expose secrets or credentials in source control.

### Reliability
- Handle device disconnections and incomplete recordings.
- Avoid presenting unavailable or invalid measurements as valid.

### Usability
- Provide a clear, responsive interface.
- Display connection and recording status prominently.

### Maintainability
- Use modular code and documented APIs.
- Maintain automated tests for critical functionality.

### Performance
- Support continuous waveform visualization without
  unnecessary interface delays.

## 6. Initial Technology Proposal

- Web frontend: React, TypeScript, and Vite
- Android application: Flutter and Dart
- Backend: Python and FastAPI
- Database: PostgreSQL
- Live communication: To be finalized after hardware review
- Signal processing: Python

## 7. Initial Development Priorities

1. Requirements and architecture
2. Website interface
3. Backend and database
4. ECG visualization
5. Recording management
6. Signal-quality assessment
7. Health journal and analytics
8. Report generation
9. Hardware integration and validation
10. Advanced analysis

## 8. Safety and Limitations

PulseCare is an academic prototype under development.
It is not a substitute for professional medical diagnosis
or emergency medical care.

Any future AI-assisted analysis must be evaluated for its
intended purpose and clearly communicate its limitations.