import { Search, ArrowUpDown, Eye, Trash2, Download, RefreshCw } from "lucide-react";
import type { DemoSession } from "../utils/sessionStorage";
import { formatSessionDuration } from "../utils/sessionStorage";

interface SessionHistoryPageProps {
  sessions: DemoSession[];
  filteredSessions: DemoSession[];
  sessionSearch: string;
  durationFilter: "all" | "short" | "medium" | "long";
  sessionSort: "newest" | "oldest";
  message: string;
  onSearchChange: (value: string) => void;
  onDurationFilterChange: (value: "all" | "short" | "medium" | "long") => void;
  onSortChange: (value: "newest" | "oldest") => void;
  onClearFilters: () => void;
  onExportSessions: () => void;
  onViewSession: (session: DemoSession) => void;
  onDeleteSession: (id: string) => void;
  onRefresh: () => void;
}

function SessionHistoryPage({
  sessions,
  filteredSessions,
  sessionSearch,
  durationFilter,
  sessionSort,
  message,
  onSearchChange,
  onDurationFilterChange,
  onSortChange,
  onClearFilters,
  onExportSessions,
  onViewSession,
  onDeleteSession,
  onRefresh,
}: SessionHistoryPageProps) {
  return (
    <div className="dashboard-content">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            SESSION HISTORY
          </div>
          <h2>Monitoring Session History</h2>
          <p>
            Review saved monitoring sessions, filter records, and inspect
            individual session reports.
          </p>
        </div>
        <span className="preview-badge">SIMULATED DATA</span>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card-content">
            <span className="stat-label">Total Saved Sessions</span>
            <strong className="stat-value">{sessions.length}</strong>
            <span className="stat-description">Available session records</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-content">
            <span className="stat-label">Filtered Results</span>
            <strong className="stat-value">{filteredSessions.length}</strong>
            <span className="stat-description">Matching your current filters</span>
          </div>
        </article>
      </section>

      <section className="panel sessions-panel">
        <div className="panel-header sessions-header">
          <div>
            <h3>Saved Sessions</h3>
            <p>Monitoring records retrieved from your session history.</p>
          </div>

          <div className="session-actions">
            <button className="secondary-button" onClick={onRefresh}>
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="secondary-button" onClick={onExportSessions}>
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {message && (
          <div className="notice-banner" role="status">
            <div className="notice-text">
              <p>{message}</p>
            </div>
          </div>
        )}

        <div className="session-filters">
          <label>
            <span>Search sessions</span>
            <div className="search-input-wrapper">
              <Search size={17} />
              <input
                type="search"
                value={sessionSearch}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search by ID, date, or data type"
              />
            </div>
          </label>

          <label>
            <span>Duration</span>
            <select
              value={durationFilter}
              onChange={(event) =>
                onDurationFilterChange(
                  event.target.value as "all" | "short" | "medium" | "long",
                )
              }
            >
              <option value="all">All durations</option>
              <option value="short">Under 1 minute</option>
              <option value="medium">1–5 minutes</option>
              <option value="long">5 minutes or longer</option>
            </select>
          </label>

          <label>
            <span>Sort by date</span>
            <select
              value={sessionSort}
              onChange={(event) =>
                onSortChange(event.target.value as "newest" | "oldest")
              }
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>

          <button className="secondary-button" onClick={onClearFilters}>
            <ArrowUpDown size={16} />
            Reset filters
          </button>
        </div>

        <div className="session-table-wrapper">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Date and Time</th>
                <th>Duration</th>
                <th>Heart Rate</th>
                <th>Data Type</th>
                <th>Session ID</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td>{new Date(session.date).toLocaleString()}</td>
                  <td>{formatSessionDuration(session.durationSeconds)}</td>
                  <td>{session.heartRate} BPM</td>
                  <td>
                    <span className="preview-badge">{session.dataType}</span>
                  </td>
                  <td title={session.id}>
                    {session.id.slice(0, 8)}…
                  </td>
                  <td>
                    <div className="session-actions">
                      <button
                        className="icon-button"
                        title="View session details"
                        aria-label="View session details"
                        onClick={() => onViewSession(session)}
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        className="icon-button"
                        title="Delete this session"
                        aria-label="Delete this session"
                        onClick={() => onDeleteSession(session.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <h3>No sessions found</h3>
                      <p>
                        {sessions.length === 0
                          ? "Save a completed demo session to see it here."
                          : "Try changing your search or duration filters."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="session-results-summary">
          Showing {filteredSessions.length} of {sessions.length} saved sessions
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>PulseCare · Cardiac Health Platform</span>
        <span>Educational prototype · Simulated data, not for diagnosis</span>
      </footer>
    </div>
  );
}

export default SessionHistoryPage;
