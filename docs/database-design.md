# PulseCare — Database Design

## 1. Overview

PulseCare requires a database to manage users, devices,
ECG sessions, recordings, health journal entries, and
analysis results.

PostgreSQL is the proposed primary database.

## 2. Core Entities

### Users
Stores account identifiers and user-related metadata.

### Devices
Stores device identifiers, device models, and ownership
or authorization relationships.

### ECG Sessions
Stores recording identifiers, device references, start
and end timestamps, and recording status.

### ECG Samples
Stores ECG waveform samples associated with a recording.

The final storage strategy will depend on the sampling
rate, recording duration, and expected data volume.

### Heart-Rate Measurements
Stores calculated BPM values and their timestamps.
Measurement provenance should identify how each value
was calculated.

### Signal-Quality Results
Stores quality assessments and processing metadata.

### Health Journal
Stores user-reported symptoms and notes associated
with relevant monitoring sessions.

### Analysis Results
Stores analysis method, version, results, and limitations.

### Reports
Stores report metadata and references to associated
recordings and analysis results.

## 3. Relationships

- A user may have multiple devices.
- A device may produce multiple ECG sessions.
- An ECG session may contain multiple ECG samples.
- An ECG session may have multiple heart-rate measurements.
- An ECG session may have multiple analysis results.
- A user may create multiple journal entries.
- A journal entry may optionally reference an ECG session.
- A report may reference an ECG session and its available
  analysis results.

These relationships will be refined during schema design.

## 4. Data Integrity

- Use unique identifiers for core records.
- Validate references between related records.
- Preserve timestamps and sampling-rate metadata.
- Identify incomplete recordings.
- Distinguish simulated data from actual device data.
- Record the provenance of calculated measurements.

## 5. Security

- Authenticate users before accessing protected records.
- Enforce ownership and authorization in the backend.
- Avoid storing passwords in plaintext.
- Never commit secrets or actual patient data to GitHub.

## 6. Future Considerations

The database schema and ECG storage strategy must support
historical queries and efficient recording retrieval.

The design will be reviewed after measuring the actual
ECG sampling rate and expected recording volume.