import { useEffect, useState } from "react";

import {
  Activity,
  Heart,
  LayoutDashboard,
  History,
  BookHeart,
  FileText,
  Settings,
  Bell,
  Search,
  Menu,
  Wifi,
  ShieldCheck,
  Clock,
  CalendarDays,
  Trash2,
  Save,
  Download,
  Filter,
  ArrowUpDown,
  X,
  Trash,
  Eye,
  Printer,
  GitCompare,
} from "lucide-react";

import "./App.css";
import StatCard from "./components/StatCard";
import ECGChart from "./components/ECGChart";
import SessionAnalytics from "./components/SessionAnalytics";
import HealthJournal from "./components/HealthJournal";
import LiveMonitoringPage from "./components/LiveMonitoringPage";
import SessionHistoryPage from "./components/SessionHistoryPage";
import ReportsPage from "./components/ReportsPage";
import { fetchJournalEntries, type JournalEntry } from "./services/journalApi";
import {
  fetchMonitoringSessions,
  deleteMonitoringSession,
  createMonitoringSession,
  clearSimulatedMonitoringSessions,
} from "./services/sessionsApi";

import {
  formatSessionDuration,
  getSessions,
  type DemoSession,
} from "./utils/sessionStorage";

import { exportSessionsToCSV } from "./utils/exportReport";
import { exportSessionReport, printSessionReport } from "./utils/sessionReport";
import { compareSessions, exportSessionComparison } from "./utils/sessionComparison";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Live Monitoring", icon: Activity },
  { label: "Session History", icon: History },
  { label: "Health Journal", icon: BookHeart },
  { label: "Reports", icon: FileText },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [heartRate, setHeartRate] = useState(72);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isCurrentSessionSaved, setIsCurrentSessionSaved] = useState(false);
  const [sessions, setSessions] = useState<DemoSession[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalAnalyticsError, setJournalAnalyticsError] = useState("");
  const [message, setMessage] = useState("");

  const [sessionSearch, setSessionSearch] = useState("");
  const [durationFilter, setDurationFilter] = useState<"all" | "short" | "medium" | "long">("all");
  const [sessionSort, setSessionSort] = useState<"newest" | "oldest">("newest");

  // Phase 7.1: selected session for the details modal.
  const [selectedSession, setSelectedSession] =
    useState<DemoSession | null>(null);

  // Phase 7.3: selected sessions for side-by-side comparison.
  const [compareSessionAId, setCompareSessionAId] = useState("");
  const [compareSessionBId, setCompareSessionBId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadJournalAnalytics() {
      try {
        const entries = await fetchJournalEntries();

        if (cancelled) return;

        setJournalEntries(entries);
        setJournalAnalyticsError("");
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load journal analytics:", error);
        setJournalAnalyticsError(
          error instanceof Error
            ? error.message
            : "Unable to load Health Journal insights.",
        );
      }
    }

    void loadJournalAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      try {
        const apiSessions = await fetchMonitoringSessions();

        if (cancelled) return;

        const mappedSessions: DemoSession[] = apiSessions
          .filter((session) => session.data_type === "SIMULATED")
          .map((session) => ({
            id: session.id,
            date: session.started_at,
            durationSeconds: session.duration_seconds,
            heartRate: session.heart_rate,
            dataType: "SIMULATED",
          }));

        setSessions(mappedSessions);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load sessions from PostgreSQL:", error);
        setSessions(getSessions());
        setMessage("Could not connect to saved sessions. Showing locally stored history.");
      }
    }

    void loadSessions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isDemoRunning) return;

    const interval = window.setInterval(() => {
      setSessionSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isDemoRunning]);

  // Close the modal using the Escape key.
  useEffect(() => {
    if (!selectedSession) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedSession(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedSession]);

  function handleToggleDemo(running: boolean) {
    if (running && !isDemoRunning) {
      setSessionSeconds(0);
      setIsCurrentSessionSaved(false);
    }

    setIsDemoRunning(running);
    setMessage("");
  }

  async function handleSaveSession() {
    if (isCurrentSessionSaved) {
      setMessage("This monitoring session has already been saved.");
      return;
    }


    if (isDemoRunning) {
      setMessage("Stop the demo before saving the session.");
      return;
    }

    if (!Number.isFinite(sessionSeconds) || sessionSeconds <= 0) {
      setMessage("Run the demo for at least one second before saving.");
      return;
    }

    if (!window.crypto?.randomUUID) {
      setMessage("Unable to generate a session ID in this browser.");
      return;
    }

    const newSession: DemoSession = {
      id: window.crypto.randomUUID(),
      date: new Date().toISOString(),
      durationSeconds: sessionSeconds,
      heartRate,
      dataType: "SIMULATED",
    };

    try {
      setMessage("Saving session to PostgreSQL...");

      await createMonitoringSession({
        id: newSession.id,
        startedAt: newSession.date,
        durationSeconds: newSession.durationSeconds,
        heartRate: newSession.heartRate,
        dataType: newSession.dataType,
      });

      
      setIsCurrentSessionSaved(true);const apiSessions = await fetchMonitoringSessions();

      const mappedSessions: DemoSession[] = apiSessions
        .filter((session) => session.data_type === "SIMULATED")
        .map((session) => ({
          id: session.id,
          date: session.started_at,
          durationSeconds: session.duration_seconds,
          heartRate: session.heart_rate,
          dataType: "SIMULATED",
        }));

      setSessions(mappedSessions);
      setMessage("Demo session saved successfully to PostgreSQL.");
    } catch (error) {
      console.error("Failed to save demo session to PostgreSQL:", error);

      setMessage(
        error instanceof Error
          ? `Unable to save the session: ${error.message}`
          : "Unable to save the session. Please try again.",
      );
    }
  }

  async function handleDeleteSession(id: string) {
    if (typeof id !== "string" || id.trim().length === 0) {
      setMessage("Cannot delete the session: invalid session ID.");
      return;
    }

    try {
      setMessage("Deleting session from PostgreSQL...");

      await deleteMonitoringSession(id);

      const apiSessions = await fetchMonitoringSessions();

      const mappedSessions: DemoSession[] = apiSessions
        .filter((session) => session.data_type === "SIMULATED")
        .map((session) => ({
          id: session.id,
          date: session.started_at,
          durationSeconds: session.duration_seconds,
          heartRate: session.heart_rate,
          dataType: "SIMULATED",
        }));

      setSessions(mappedSessions);

      setSelectedSession((current) =>
        current?.id === id ? null : current,
      );

      setCompareSessionAId((current) =>
        current === id ? "" : current,
      );

      setCompareSessionBId((current) =>
        current === id ? "" : current,
      );

      setMessage("Demo session deleted successfully from PostgreSQL.");
    } catch (error) {
      console.error("Failed to delete session from PostgreSQL:", error);

      setMessage(
        error instanceof Error
          ? `Unable to delete the session: ${error.message}`
          : "Unable to delete the session. Please try again.",
      );
    }
  }

  async function handleClearAllSessions() {
    if (sessions.length === 0) {
      setMessage("There are no saved simulated sessions to clear.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${sessions.length} saved simulated sessions from PostgreSQL? Device sessions will be preserved. This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setMessage("Clearing simulated sessions from PostgreSQL...");

      await clearSimulatedMonitoringSessions();

      const apiSessions = await fetchMonitoringSessions();

      const mappedSessions: DemoSession[] = apiSessions
        .filter((session) => session.data_type === "SIMULATED")
        .map((session) => ({
          id: session.id,
          date: session.started_at,
          durationSeconds: session.duration_seconds,
          heartRate: session.heart_rate,
          dataType: "SIMULATED",
        }));

      setSessions(mappedSessions);
      setSelectedSession(null);
      setCompareSessionAId("");
      setCompareSessionBId("");
      setMessage("All simulated sessions have been cleared. Device sessions were preserved.");
    } catch (error) {
      console.error("Failed to clear simulated sessions:", error);

      setMessage(
        error instanceof Error
          ? `Unable to clear simulated sessions: ${error.message}`
          : "Unable to clear simulated sessions. Please try again.",
      );
    }
  }

  function handleExportSessions() {
    try {
      exportSessionsToCSV(sessions);
      setMessage("CSV report exported successfully.");
    } catch {
      setMessage("Unable to export the CSV report.");
    }
  }

  function handleResetSession() {
    if (isDemoRunning) {
      setMessage("Stop the demo before resetting the session.");
      return;
    }

    if (sessionSeconds > 0 && !isCurrentSessionSaved) {
      const confirmed = window.confirm(
        "This monitoring session has not been saved. Reset it and discard its current duration?"
      );

      if (!confirmed) return;
    }

    setIsDemoRunning(false);
    setSessionSeconds(0);
    setIsCurrentSessionSaved(false);
    setMessage("Monitoring session reset.");
  }

  // Phase 7.1: open the details modal.
  function handleViewSession(session: DemoSession) {
    setSelectedSession(session);
  }

  // Phase 7.2: export the selected session as a text report.
  function handleExportSessionReport() {
    if (!selectedSession) return;

    try {
      exportSessionReport(selectedSession);
      setMessage("Session report exported successfully.");
    } catch {
      setMessage("Unable to export the session report.");
    }
  }

  // Phase 7.2: open a clean report window for printing or saving as PDF.
  function handlePrintSessionReport() {
    if (!selectedSession) return;

    try {
      printSessionReport(selectedSession);
      setMessage("Session report opened. Use the print dialog to print or save as PDF.");
    } catch {
      setMessage("Unable to open the report. Please allow pop-ups for this site and try again.");
    }
  }

  // Phase 7.3: export a comparison between two distinct saved sessions.
  function handleExportSessionComparison() {
    const sessionA = sessions.find((session) => session.id === compareSessionAId);
    const sessionB = sessions.find((session) => session.id === compareSessionBId);

    if (!sessionA || !sessionB) {
      setMessage("Choose two saved sessions to compare.");
      return;
    }

    if (sessionA.id === sessionB.id) {
      setMessage("Choose two different sessions to compare.");
      return;
    }

    try {
      exportSessionComparison(sessionA, sessionB);
      setMessage("Session comparison report exported successfully.");
    } catch {
      setMessage("Unable to export the session comparison report.");
    }
  }

  const comparisonSessionA = sessions.find(
    (session) => session.id === compareSessionAId,
  );
  const comparisonSessionB = sessions.find(
    (session) => session.id === compareSessionBId,
  );
  const sessionComparison =
    comparisonSessionA && comparisonSessionB &&
    comparisonSessionA.id !== comparisonSessionB.id
      ? compareSessions(comparisonSessionA, comparisonSessionB)
      : null;

  // Search, filter, and sort saved sessions.
  const filteredSessions = sessions
    .filter((session) => {
      const searchTerm = sessionSearch.trim().toLowerCase();

      const matchesSearch =
        session.id.toLowerCase().includes(searchTerm) ||
        session.date.toLowerCase().includes(searchTerm) ||
        session.dataType.toLowerCase().includes(searchTerm);

      const matchesDuration =
        durationFilter === "all" ||
        (durationFilter === "short" &&
          session.durationSeconds < 60) ||
        (durationFilter === "medium" &&
          session.durationSeconds >= 60 &&
          session.durationSeconds < 300) ||
        (durationFilter === "long" &&
          session.durationSeconds >= 300);

      return matchesSearch && matchesDuration;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (!Number.isFinite(dateA) || !Number.isFinite(dateB)) {
        return 0;
      }

      return sessionSort === "oldest"
        ? dateA - dateB
        : dateB - dateA;
    });

  function handleClearFilters() {
    setSessionSearch("");
    setDurationFilter("all");
    setSessionSort("newest");
    setMessage("");
  }

  const totalSavedSessions = sessions.length;

  const averageHeartRate =
    totalSavedSessions > 0
      ? Math.round(
          sessions.reduce((total, session) => total + session.heartRate, 0) /
            totalSavedSessions,
        )
      : null;

  const totalMonitoringSeconds = sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  );

  const moodDistribution = journalEntries.reduce<Record<string, number>>(
    (distribution, entry) => {
      const mood = entry.mood?.trim() || "Unspecified";
      distribution[mood] = (distribution[mood] ?? 0) + 1;
      return distribution;
    },
    {},
  );

  const latestSession = sessions.reduce<DemoSession | null>(
    (latest, session) =>
      !latest ||
      new Date(session.date).getTime() > new Date(latest.date).getTime()
        ? session
        : latest,
    null,
  );

  const latestJournalEntry = journalEntries.reduce<JournalEntry | null>(
    (latest, entry) =>
      !latest ||
      new Date(entry.entry_date).getTime() >
        new Date(latest.entry_date).getTime()
        ? entry
        : latest,
    null,
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Heart size={23} />
          </div>

          <div>
            <h1>PulseCare</h1>
            <p>Cardiac Health Platform</p>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-item ${activePage === item.label ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setActivePage(item.label);
                  setSelectedSession(null);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <ShieldCheck size={23} />

            <h3>Your health, your data</h3>

            <p>
              Your health information should be handled securely and
              responsibly.
            </p>
          </div>

          <button className="nav-item settings-button" type="button">
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="profile">
            <div className="avatar">PC</div>

            <div className="profile-details">
              <strong>PulseCare User</strong>
              <span>Personal account</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            type="button"
            aria-label="Menu"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search..."
                aria-label="Search"
              />
            </div>

            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>

            <div className="top-avatar">PC</div>
          </div>
        </header>

        <div className="dashboard-content" style={{ display: activePage === "Dashboard" ? "block" : "none" }}>
          <section className="welcome-section">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                YOUR HEALTH OVERVIEW
              </div>

              <h2>Good day!</h2>

              <p>
                Here's an overview of your cardiac monitoring activity.
              </p>
            </div>

            <div className="date-button">
              <CalendarDays size={17} />
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </section>

          <section className="notice-banner">
            <div className="notice-icon">
              <Activity size={21} />
            </div>

            <div className="notice-text">
              <strong>
                {isDemoRunning ? "Demo monitoring active" : "Preview mode"}
              </strong>

              <p>
                All readings and ECG signals are simulated demonstration
                data, not measurements from your device.
              </p>
            </div>

            <span className="preview-badge">DEMO DATA</span>
          </section>

          <section className="stats-grid">
            <StatCard
              title="Heart Rate"
              value={String(heartRate)}
              unit="BPM"
              icon={<Heart size={19} />}
              description="Simulated reading Â· Not real"
              status={isDemoRunning ? "active" : "normal"}
            />

            <StatCard
              title="Monitoring Time"
              value={formatSessionDuration(sessionSeconds)}
              icon={<Clock size={19} />}
              description={
                isDemoRunning
                  ? "Demo session running"
                  : "Demo session paused"
              }
              status={isDemoRunning ? "active" : "inactive"}
            />

            <StatCard
              title="Recorded Sessions"
              value={String(sessions.length)}
              unit="sessions"
              icon={<Activity size={19} />}
              description="Saved demo sessions"
              status="normal"
            />

            <StatCard
              title="Device Connection"
              value="Not connected"
              icon={<Wifi size={19} />}
              description="Hardware integration pending"
              status="inactive"
            />
          </section>

          <section className="monitoring-grid">
            <ECGChart
              isDemoRunning={isDemoRunning}
              onDemoStateChange={handleToggleDemo}
              onHeartRateChange={setHeartRate}
              sessionSeconds={sessionSeconds}
              onResetSession={handleResetSession}
            />

            <article className="panel activity-panel">
              <div className="panel-header">
                <div>
                  <h3>Monitoring Activity</h3>
                  <p>Illustrative activity summary</p>
                </div>
              </div>

              <div className="activity-total">
                <div>
                  <span className="small-label">Saved demo sessions</span>
                  <h2>{sessions.length}</h2>
                </div>
              </div>

              <div className="activity-note">
                This count reflects saved demo sessions. See Session
                Analytics below for a summary of saved simulated sessions.
              </div>
            </article>
          </section>

          <SessionAnalytics sessions={sessions} />

          <section className="panel pulse-analytics-panel" style={{ padding: "24px", marginBottom: "24px" }}>
            <div className="panel-header" style={{ marginBottom: "20px" }}>
              <div>
                <h3>PulseCare Analytics</h3>
                <p>Insights from saved monitoring sessions and your Health Journal</p>
              </div>
              <span className="analytics-simulated-badge">SIMULATED DATA</span>
            </div>

            <div className="pulse-analytics-grid">
              <article className="pulse-analytics-card">
                <span className="pulse-analytics-label">Total Sessions</span>
                <strong>{totalSavedSessions}</strong>
                <span className="pulse-analytics-note">Saved monitoring sessions</span>
              </article>

              <article className="pulse-analytics-card">
                <span className="pulse-analytics-label">Average Heart Rate</span>
                <strong>
                  {averageHeartRate === null ? "—" : averageHeartRate}
                  {averageHeartRate !== null && <small> BPM</small>}
                </strong>
                <span className="pulse-analytics-note">Average of saved session readings</span>
              </article>

              <article className="pulse-analytics-card">
                <span className="pulse-analytics-label">Total Monitoring Time</span>
                <strong>
                  {Math.floor(totalMonitoringSeconds / 3600)}h{" "}
                  {Math.floor((totalMonitoringSeconds % 3600) / 60)}m
                </strong>
                <span className="pulse-analytics-note">Combined saved session duration</span>
              </article>

              <article className="pulse-analytics-card">
                <span className="pulse-analytics-label">Journal Entries</span>
                <strong>{journalEntries.length}</strong>
                <span className="pulse-analytics-note">Entries recorded in Health Journal</span>
              </article>
            </div>

            <div className="pulse-analytics-details">
              <article className="pulse-analytics-detail">
                <h4>Heart Rate Trends</h4>
                <p>Recorded average readings from your saved sessions. These are simulated readings, not medical measurements.</p>

                {sessions.length === 0 ? (
                  <p className="pulse-analytics-empty">No saved sessions available yet.</p>
                ) : (
                  <div className="pulse-trend-list">
                    {[...sessions]
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() - new Date(b.date).getTime(),
                      )
                      .slice(-7)
                      .map((session) => (
                        <div className="pulse-trend-row" key={session.id}>
                          <span>{new Date(session.date).toLocaleDateString()}</span>
                          <div className="pulse-trend-track">
                            <div
                              className="pulse-trend-bar"
                              style={{
                                width: `${Math.max(4, Math.min(100, (session.heartRate / 200) * 100))}%`,
                              }}
                            />
                          </div>
                          <strong>{session.heartRate} BPM</strong>
                        </div>
                      ))}
                  </div>
                )}
              </article>

              <article className="pulse-analytics-detail">
                <h4>Health Journal Insights</h4>

                {journalAnalyticsError ? (
                  <p className="pulse-analytics-error">
                    Unable to load journal insights: {journalAnalyticsError}
                  </p>
                ) : journalEntries.length === 0 ? (
                  <p className="pulse-analytics-empty">
                    No journal entries yet. Add an entry in Health Journal to see your insights.
                  </p>
                ) : (
                  <>
                    <p className="pulse-analytics-note">
                      Mood distribution across {journalEntries.length} journal entries.
                    </p>
                    <div className="pulse-mood-list">
                      {Object.entries(moodDistribution)
                        .sort((a, b) => b[1] - a[1])
                        .map(([mood, count]) => (
                          <div className="pulse-mood-row" key={mood}>
                            <span>{mood}</span>
                            <div className="pulse-trend-track">
                              <div
                                className="pulse-mood-bar"
                                style={{
                                  width: `${(count / journalEntries.length) * 100}%`,
                                }}
                              />
                            </div>
                            <strong>{count}</strong>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </article>
            </div>

            <div className="pulse-analytics-activity">
              <article>
                <span className="pulse-analytics-label">Latest Monitoring Session</span>
                {latestSession ? (
                  <p>
                    {new Date(latestSession.date).toLocaleString()} ·{" "}
                    {latestSession.heartRate} BPM ·{" "}
                    {Math.floor(latestSession.durationSeconds / 60)}m{" "}
                    {latestSession.durationSeconds % 60}s
                  </p>
                ) : (
                  <p>No monitoring sessions saved yet.</p>
                )}
              </article>

              <article>
                <span className="pulse-analytics-label">Latest Journal Entry</span>
                {latestJournalEntry ? (
                  <p>
                    {latestJournalEntry.title} ·{" "}
                    {new Date(latestJournalEntry.entry_date).toLocaleDateString()}
                  </p>
                ) : (
                  <p>No journal entries saved yet.</p>
                )}
              </article>
            </div>
          </section>

          {/* Phase 7.3: Compare two saved demo sessions. */}
          <section className="panel" style={{ padding: "24px", marginBottom: "24px" }}>
            <div className="panel-header" style={{ marginBottom: "18px" }}>
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                  <GitCompare size={20} /> Session Comparison
                </h3>
                <p>Compare the simulated heart-rate values and durations of two saved sessions.</p>
              </div>
              <button
                className="outline-button"
                type="button"
                onClick={handleExportSessionComparison}
                disabled={!comparisonSessionA || !comparisonSessionB || compareSessionAId === compareSessionBId}
              >
                <Download size={16} /> Export Comparison
              </button>
            </div>

            {sessions.length < 2 ? (
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                Save at least two demo sessions to compare them here.
              </p>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "18px" }}>
                  <label style={{ display: "grid", gap: "8px", color: "#475569", fontSize: "13px", fontWeight: 600 }}>
                    Session A
                    <select
                      value={compareSessionAId}
                      onChange={(event) => setCompareSessionAId(event.target.value)}
                      aria-label="Select session A to compare"
                      style={{ width: "100%", padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: "9px", background: "#fff", color: "#0f172a" }}
                    >
                      <option value="">Choose a session</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.date} â€” {formatSessionDuration(session.durationSeconds)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: "8px", color: "#475569", fontSize: "13px", fontWeight: 600 }}>
                    Session B
                    <select
                      value={compareSessionBId}
                      onChange={(event) => setCompareSessionBId(event.target.value)}
                      aria-label="Select session B to compare"
                      style={{ width: "100%", padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: "9px", background: "#fff", color: "#0f172a" }}
                    >
                      <option value="">Choose a session</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.date} â€” {formatSessionDuration(session.durationSeconds)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {compareSessionAId && compareSessionAId === compareSessionBId && (
                  <p role="alert" style={{ color: "#b45309", margin: "0 0 16px" }}>
                    Choose two different sessions to compare them.
                  </p>
                )}

                {sessionComparison && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                      {[{ label: "Heart Rate", a: `${sessionComparison.sessionA.heartRate} BPM`, b: `${sessionComparison.sessionB.heartRate} BPM`, difference: `${sessionComparison.heartRateDifference > 0 ? "+" : ""}${sessionComparison.heartRateDifference} BPM` }, { label: "Duration", a: formatSessionDuration(sessionComparison.sessionA.durationSeconds), b: formatSessionDuration(sessionComparison.sessionB.durationSeconds), difference: `${sessionComparison.durationDifferenceSeconds > 0 ? "+" : ""}${formatSessionDuration(Math.abs(sessionComparison.durationDifferenceSeconds))}${sessionComparison.durationDifferenceSeconds < 0 ? " shorter" : sessionComparison.durationDifferenceSeconds > 0 ? " longer" : " difference"}` }].map((metric) => (
                        <div key={metric.label} style={{ padding: "17px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#f8fafc" }}>
                          <strong style={{ display: "block", color: "#334155", fontSize: "13px", marginBottom: "13px" }}>{metric.label}</strong>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div><span style={{ display: "block", color: "#64748b", fontSize: "11px", marginBottom: "5px" }}>SESSION A</span><strong style={{ color: "#1d4ed8", fontSize: "15px" }}>{metric.a}</strong></div>
                            <div><span style={{ display: "block", color: "#64748b", fontSize: "11px", marginBottom: "5px" }}>SESSION B</span><strong style={{ color: "#0f766e", fontSize: "15px" }}>{metric.b}</strong></div>
                          </div>
                          <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "13px", paddingTop: "10px", color: "#475569", fontSize: "12px" }}>
                            Difference (B âˆ’ A): <strong>{metric.difference}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: "16px", padding: "13px 15px", border: "1px solid #fde68a", borderRadius: "10px", background: "#fffbeb", color: "#92400e", fontSize: "12px", lineHeight: 1.6 }}>
                      <strong>Simulated data only:</strong> These values are demonstration data, not verified ECG measurements. Do not use this comparison for diagnosis or medical decisions.
                    </div>
                  </>
                )}
              </>
            )}
          </section>

          <section className="panel sessions-panel">
            <div className="panel-header sessions-header">
              <div>
                <h3>Recent Sessions</h3>
                <p>Saved simulated sessions stored in this browser</p>
              </div>

              <div className="session-actions">
                <button
                  className="outline-button"
                  type="button"
                  onClick={handleExportSessions}
                  disabled={sessions.length === 0}
                >
                  <Download size={16} />
                  Export CSV
                </button>

                <button
                  className="outline-button"
                  type="button"
                  onClick={handleSaveSession}
                  disabled={isDemoRunning || sessionSeconds === 0}
                >
                  <Save size={16} />
                  Save Session
                </button>

                <button
                  className="outline-button clear-all-button"
                  type="button"
                  onClick={handleClearAllSessions}
                  disabled={sessions.length === 0}
                >
                  <Trash size={16} />
                  Clear All
                </button>
              </div>
            </div>

            {message && (
              <p className="session-message" role="status">
                {message}
              </p>
            )}

            <div className="session-toolbar">
              <div className="session-search-box">
                <Search size={17} />

                <input
                  type="text"
                  value={sessionSearch}
                  onChange={(event) => setSessionSearch(event.target.value)}
                  placeholder="Search by session ID, date, or type..."
                  aria-label="Search sessions"
                />

                {sessionSearch && (
                  <button
                    type="button"
                    className="clear-search-button"
                    onClick={() => setSessionSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="session-select-control">
                <Filter size={16} />

                <select
                  value={durationFilter}
                  onChange={(event) => setDurationFilter(event.target.value as "all" | "short" | "medium" | "long")}
                  aria-label="Filter sessions by duration"
                >
                  <option value="all">All durations</option>
                  <option value="short">Under 1 minute</option>
                  <option value="medium">1â€“5 minutes</option>
                  <option value="long">5 minutes or more</option>
                </select>
              </div>

              <div className="session-select-control">
                <ArrowUpDown size={16} />

                <select
                  value={sessionSort}
                  onChange={(event) => setSessionSort(event.target.value as "newest" | "oldest")}
                  aria-label="Sort sessions"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>

              <button
                className="outline-button clear-filters-button"
                type="button"
                onClick={handleClearFilters}
                disabled={
                  !sessionSearch &&
                  durationFilter === "all" &&
                  sessionSort === "newest"
                }
              >
                Clear filters
              </button>
            </div>

            <div className="session-results-info">
              Showing {filteredSessions.length} of {sessions.length} sessions
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>SESSION DATE</th>
                    <th>DURATION</th>
                    <th>HEART RATE</th>
                    <th>DATA TYPE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        {sessions.length === 0
                          ? "No saved sessions yet. Run the demo, stop it, and save a session to see it here."
                          : "No sessions match your search or selected filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.id}>
                        <td>{session.date}</td>

                        <td>
                          {formatSessionDuration(session.durationSeconds)}
                        </td>

                        <td>
                          <strong className="session-bpm">
                            {session.heartRate} BPM
                          </strong>
                        </td>

                        <td>
                          <span className="preview-badge">
                            {session.dataType}
                          </span>
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <button
                              className="icon-button"
                              type="button"
                              aria-label={`View details for session ${session.id}`}
                              title="View details"
                              onClick={() => handleViewSession(session)}
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              className="icon-button"
                              type="button"
                              aria-label={`Delete session ${session.id}`}
                              title="Delete session"
                              onClick={() => handleDeleteSession(session.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>PulseCare Â· Cardiac Health Platform</span>

            <span>
              <ShieldCheck size={14} />
              Educational prototype Â· Not for diagnosis
            </span>
          </footer>
        </div>

        {activePage === "Health Journal" && (
          <div className="dashboard-content">
            <HealthJournal />
          </div>
        )}

        {activePage === "Live Monitoring" && (
          <LiveMonitoringPage
            isDemoRunning={isDemoRunning}
            heartRate={heartRate}
            sessionSeconds={sessionSeconds}
            savedSessionCount={sessions.length}
            onDemoStateChange={handleToggleDemo}
            onHeartRateChange={setHeartRate}
            onResetSession={handleResetSession}
          />
        )}

{activePage === "Reports" && (
  <ReportsPage
    sessions={sessions}
    journalEntries={journalEntries}
    onExportSessions={handleExportSessions}
  />
)}

{activePage === "Session History" && (
  <SessionHistoryPage
    sessions={sessions}
    filteredSessions={filteredSessions}
    sessionSearch={sessionSearch}
    durationFilter={durationFilter}
    sessionSort={sessionSort}
    message={message}
    onSearchChange={setSessionSearch}
    onDurationFilterChange={setDurationFilter}
    onSortChange={setSessionSort}
    onClearFilters={handleClearFilters}
    onExportSessions={handleExportSessions}
    onViewSession={handleViewSession}
    onDeleteSession={handleDeleteSession}
    onRefresh={() => {
      void fetchMonitoringSessions()
        .then((apiSessions) => {
          setSessions(
            apiSessions
              .filter((session) => session.data_type === "SIMULATED")
              .map((session) => ({
                id: session.id,
                date: session.started_at,
                durationSeconds: session.duration_seconds,
                heartRate: session.heart_rate,
                dataType: "SIMULATED" as const,
              })),
          );
          setMessage("Session history refreshed.");
        })
        .catch((error: unknown) => {
          setMessage(
            error instanceof Error
              ? `Unable to refresh session history: ${error.message}`
              : "Unable to refresh session history.",
          );
        });
    }}
  />
)}

        {activePage !== "Dashboard" &&
          activePage !== "Health Journal" &&
          activePage !== "Live Monitoring" &&
  activePage !== "Session History" && (
            <div className="dashboard-content">
              <section className="welcome-section">
                <div>
                  <h2>{activePage}</h2>
                  <p>This section is not yet connected to its dedicated page.</p>
                </div>
              </section>
            </div>
          )}
      </main>

      {/* Phase 7.1: Session Details Modal */}
      {selectedSession && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedSession(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(15, 23, 42, 0.58)",
            backdropFilter: "blur(4px)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-details-title"
            className="session-details-modal"
            style={{
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "26px",
              border: "1px solid #e2e8f0",
              borderRadius: "18px",
              background: "#ffffff",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.24)",
              color: "#0f172a",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <Activity size={15} />
                  SESSION DETAILS
                </div>

                <h2
                  id="session-details-title"
                  style={{
                    margin: 0,
                    fontSize: "23px",
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Monitoring Session
                </h2>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#64748b",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  Review the information saved for this demo session.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Close session details"
                title="Close"
                onClick={() => setSelectedSession(null)}
              >
                <X size={19} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
                gap: "12px",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  padding: "17px",
                  border: "1px solid #dbeafe",
                  borderRadius: "12px",
                  background: "#eff6ff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    marginBottom: "12px",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <Heart size={16} />
                  Heart Rate
                </div>

                <div
                  style={{
                    fontSize: "27px",
                    fontWeight: 750,
                    color: "#1d4ed8",
                  }}
                >
                  {selectedSession.heartRate}
                  <span
                    style={{
                      marginLeft: "5px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    BPM
                  </span>
                </div>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#64748b",
                    fontSize: "11px",
                  }}
                >
                  Simulated value
                </p>
              </div>

              <div
                style={{
                  padding: "17px",
                  border: "1px solid #ccfbf1",
                  borderRadius: "12px",
                  background: "#f0fdfa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    marginBottom: "12px",
                    color: "#0f766e",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <Clock size={16} />
                  Duration
                </div>

                <div
                  style={{
                    fontSize: "23px",
                    fontWeight: 750,
                    color: "#115e59",
                  }}
                >
                  {formatSessionDuration(selectedSession.durationSeconds)}
                </div>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#64748b",
                    fontSize: "11px",
                  }}
                >
                  Total session time
                </p>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "15px 0",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  Session ID
                </span>

                <strong
                  style={{
                    maxWidth: "68%",
                    textAlign: "right",
                    fontSize: "12px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {selectedSession.id}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "15px 0",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  Session date
                </span>

                <strong
                  style={{
                    maxWidth: "68%",
                    textAlign: "right",
                    fontSize: "13px",
                  }}
                >
                  {selectedSession.date}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  padding: "15px 0",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  Data type
                </span>

                <span
                  className="preview-badge"
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: "7px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {selectedSession.dataType}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginTop: "20px",
                padding: "14px",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                background: "#fffbeb",
                color: "#92400e",
              }}
            >
              <ShieldCheck
                size={19}
                style={{ flexShrink: 0, marginTop: "1px" }}
              />

              <div>
                <strong
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "12px",
                  }}
                >
                  Important disclaimer
                </strong>

                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    lineHeight: 1.6,
                  }}
                >
                  This is a simulated educational session. The heart rate
                  and other displayed values are not verified measurements
                  from an ECG device and must not be used for diagnosis or
                  medical decisions.
                </p>
              </div>
            </div>

            <div
              className="session-details-modal-actions"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "24px",
              }}
            >
              <button
                type="button"
                className="outline-button"
                onClick={handleExportSessionReport}
              >
                <Download size={16} />
                Export Report
              </button>

              <button
                type="button"
                className="outline-button"
                onClick={handlePrintSessionReport}
              >
                <Printer size={16} />
                Print / Save PDF
              </button>

              <button
                type="button"
                className="outline-button"
                onClick={() => setSelectedSession(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;































