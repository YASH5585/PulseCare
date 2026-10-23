import { useMemo, useState } from "react";
import { Activity, BookHeart, CalendarDays, Clock, Download, Printer } from "lucide-react";
import type { DemoSession } from "../utils/sessionStorage";
import type { JournalEntry } from "../services/journalApi";

interface ReportsPageProps {
  sessions: DemoSession[];
  journalEntries: JournalEntry[];
  onExportSessions: () => void;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

function getDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ReportsPage({
  sessions,
  journalEntries,
  onExportSessions,
}: ReportsPageProps) {
  const today = getDateInputValue(new Date());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(today);

  const filteredSessions = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    return sessions.filter((session) => {
      const date = new Date(session.date);
      if (Number.isNaN(date.getTime())) return false;
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  }, [sessions, startDate, endDate]);

  const filteredJournalEntries = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    return journalEntries.filter((entry) => {
      const date = new Date(entry.entry_date);
      if (Number.isNaN(date.getTime())) return false;
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  }, [journalEntries, startDate, endDate]);

  const totalDuration = filteredSessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  );

  const averageHeartRate = filteredSessions.length
    ? Math.round(
        filteredSessions.reduce((total, session) => total + session.heartRate, 0) /
          filteredSessions.length,
      )
    : null;

  const minHeartRate = filteredSessions.length
    ? Math.min(...filteredSessions.map((session) => session.heartRate))
    : null;

  const maxHeartRate = filteredSessions.length
    ? Math.max(...filteredSessions.map((session) => session.heartRate))
    : null;

  function exportReportCSV() {
    const escapeCSV = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = [
      ["PulseCare Monitoring Report"],
      ["Report period", startDate || "All dates", endDate || "All dates"],
      [],
      ["Date", "Duration (seconds)", "Recorded heart rate (BPM)", "Data source", "Session ID"],
      ...filteredSessions.map((session) => [
        session.date,
        session.durationSeconds,
        session.heartRate,
        session.dataType,
        session.id,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => escapeCSV(cell ?? "")).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pulsecare-report-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="dashboard-content reports-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">PULSECARE / REPORTS</p>
          <h1>Health Reports</h1>
          <p>Review saved monitoring sessions and Health Journal activity.</p>
        </div>
        <div className="report-actions">
          <button
            className="outline-button"
            type="button"
            onClick={exportReportCSV}
          >
            <Download size={16} /> Export Report CSV
          </button>
          <button
            className="outline-button"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>
      </header>

      <div className="report-disclaimer" role="note">
        <strong>Demo data notice:</strong> Simulated ECG readings are not real
        medical measurements and must not be used for diagnosis or treatment.
      </div>

      <section className="report-filter-panel">
        <div className="report-filter-heading">
          <CalendarDays size={18} />
          <h2>Report period</h2>
        </div>
        <label>
          Start date
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <button
          className="outline-button"
          type="button"
          onClick={() => {
            setStartDate("");
            setEndDate(today);
          }}
        >
          Reset dates
        </button>
      </section>

      <div className="stats-grid report-stats-grid">
        <article className="stat-card">
          <div className="stat-card-icon"><Activity size={20} /></div>
          <p>Monitoring sessions</p>
          <strong>{filteredSessions.length}</strong>
          <span>In selected period</span>
        </article>
        <article className="stat-card">
          <div className="stat-card-icon"><Clock size={20} /></div>
          <p>Total monitoring time</p>
          <strong>{formatDuration(totalDuration)}</strong>
          <span>Across filtered sessions</span>
        </article>
        <article className="stat-card">
          <div className="stat-card-icon"><Activity size={20} /></div>
          <p>Average recorded heart rate</p>
          <strong>{averageHeartRate === null ? "—" : `${averageHeartRate} BPM`}</strong>
          <span>Session-level average; demo readings may be simulated</span>
        </article>
        <article className="stat-card">
          <div className="stat-card-icon"><BookHeart size={20} /></div>
          <p>Journal entries</p>
          <strong>{filteredJournalEntries.length}</strong>
          <span>In selected period</span>
        </article>
      </div>

      <section className="report-section">
        <div className="section-heading">
          <div>
            <h2>Monitoring session details</h2>
            <p>
              {filteredSessions.length} session(s)
              {minHeartRate !== null && maxHeartRate !== null
                ? ` · Recorded heart-rate range: ${minHeartRate}–${maxHeartRate} BPM`
                : ""}
            </p>
          </div>
          <button
            className="outline-button"
            type="button"
            onClick={onExportSessions}
            disabled={filteredSessions.length === 0}
          >
            <Download size={16} /> Export all sessions
          </button>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="report-empty-state">
            No monitoring sessions found in this date range.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Recorded heart rate</th>
                  <th>Data source</th>
                  <th>Session ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.id}>
                    <td>{new Date(session.date).toLocaleString()}</td>
                    <td>{formatDuration(session.durationSeconds)}</td>
                    <td>{session.heartRate} BPM</td>
                    <td>{session.dataType === "SIMULATED" ? "Simulated" : session.dataType}</td>
                    <td className="report-session-id">{session.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="report-section">
        <div className="section-heading">
          <div>
            <h2>Health Journal summary</h2>
            <p>Journal entries recorded during the selected period.</p>
          </div>
        </div>

        {filteredJournalEntries.length === 0 ? (
          <div className="report-empty-state">
            No Health Journal entries found in this date range.
          </div>
        ) : (
          <div className="journal-report-list">
            {filteredJournalEntries.map((entry) => (
              <article className="journal-report-entry" key={entry.id}>
                <div>
                  <h3>{entry.title}</h3>
                  <time>{new Date(entry.entry_date).toLocaleString()}</time>
                </div>
                <p>{entry.notes || "No notes provided."}</p>
                <div className="journal-report-meta">
                  <span>Mood: {entry.mood || "Not specified"}</span>
                  {entry.tags.length > 0 && <span>Tags: {entry.tags.join(", ")}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="report-footer">
        This report summarizes data saved in PulseCare. It is not a medical
        diagnosis or a substitute for advice from a qualified healthcare professional.
      </footer>
    </section>
  );
}
