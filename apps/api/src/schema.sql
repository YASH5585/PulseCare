CREATE TABLE IF NOT EXISTS monitoring_sessions (
    id UUID PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
    heart_rate INTEGER NOT NULL CHECK (heart_rate > 0 AND heart_rate <= 300),
    data_type VARCHAR(20) NOT NULL DEFAULT 'SIMULATED'
        CHECK (data_type IN ('SIMULATED', 'DEVICE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_started_at
    ON monitoring_sessions (started_at DESC);

CREATE TABLE IF NOT EXISTS health_journal_entries (
    id UUID PRIMARY KEY,
    title VARCHAR(150) NOT NULL
        CHECK (CHAR_LENGTH(TRIM(title)) > 0),
    notes TEXT NOT NULL DEFAULT '',
    mood VARCHAR(30),
    tags TEXT[] NOT NULL DEFAULT '{}',
    entry_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (CHAR_LENGTH(notes) <= 10000),
    CHECK (mood IS NULL OR CHAR_LENGTH(mood) <= 30)
);

CREATE INDEX IF NOT EXISTS idx_health_journal_entries_entry_date
    ON health_journal_entries (entry_date DESC);
