import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BookHeart, CalendarDays, Edit3, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import {
  createJournalEntry,
  deleteJournalEntry,
  fetchJournalEntries,
  updateJournalEntry,
  type JournalEntry,
  type JournalEntryInput,
} from "../services/journalApi";

const moods = ["Happy", "Good", "Neutral", "Stressed", "Low"];

const emptyForm = {
  title: "",
  notes: "",
  mood: "Good",
  tags: "",
  entryDate: new Date().toLocaleDateString("en-CA"),
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HealthJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchJournalEntries();
      setEntries(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load journal entries.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  function resetForm() {
    setForm({
      ...emptyForm,
      entryDate: new Date().toLocaleDateString("en-CA"),
    });
    setEditingId(null);
  }

  function handleEdit(entry: JournalEntry) {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      notes: entry.notes,
      mood: entry.mood ?? "Neutral",
      tags: entry.tags.join(", "),
      entryDate: new Date(entry.entry_date).toLocaleDateString("en-CA"),
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const title = form.title.trim();
    const notes = form.notes.trim();

    if (!title) {
      setError("Please enter a title for your journal entry.");
      return;
    }

    const input: JournalEntryInput = {
      title,
      notes,
      mood: form.mood || null,
      tags: [...new Set(
        form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      )],
      entryDate: form.entryDate
        ? new Date(`${form.entryDate}T12:00:00`).toISOString()
        : undefined,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateJournalEntry(editingId, input);
        setMessage("Journal entry updated successfully.");
      } else {
        await createJournalEntry(input);
        setMessage("Journal entry saved successfully.");
      }

      resetForm();
      await loadEntries();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your journal entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: JournalEntry) {
    const confirmed = window.confirm(
      `Delete "${entry.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deleteJournalEntry(entry.id);

      if (editingId === entry.id) resetForm();

      setEntries((current) =>
        current.filter((item) => item.id !== entry.id),
      );
      setMessage("Journal entry deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this journal entry.",
      );
    }
  }

  const styles = {
    panel: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "22px",
    } as const,
    label: {
      display: "grid",
      gap: "8px",
      color: "#334155",
      fontSize: "13px",
      fontWeight: 600,
    } as const,
    input: {
      width: "100%",
      boxSizing: "border-box" as const,
      padding: "11px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "9px",
      font: "inherit",
      color: "#0f172a",
      background: "#ffffff",
    } as const,
    button: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "10px 14px",
      borderRadius: "9px",
      fontWeight: 600,
      cursor: "pointer",
    } as const,
  };

  return (
    <div style={{ padding: "28px", maxWidth: "1100px", margin: "0 auto" }}>
      <section style={{ marginBottom: "26px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "10px",
            color: "#2563eb",
          }}
        >
          <BookHeart size={25} />
          <span style={{ fontSize: "12px", fontWeight: 750, letterSpacing: "1px" }}>
            PERSONAL HEALTH RECORDS
          </span>
        </div>

        <h2 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "28px" }}>
          Health Journal
        </h2>

        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>
          Record how you feel, note your daily health observations, and keep
          your entries organized in one place.
        </p>
      </section>

      {error && (
        <div
          role="alert"
          style={{
            padding: "13px 16px",
            marginBottom: "16px",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            padding: "13px 16px",
            marginBottom: "16px",
            border: "1px solid #bbf7d0",
            borderRadius: "10px",
            background: "#f0fdf4",
            color: "#166534",
          }}
        >
          {message}
        </div>
      )}

      <section style={styles.panel}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "22px",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 6px", color: "#0f172a", fontSize: "18px" }}>
              {editingId ? "Edit Journal Entry" : "Create Journal Entry"}
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
              Record your observations and daily well-being.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              style={{
                ...styles.button,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
              }}
              onClick={resetForm}
            >
              <X size={16} /> Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              marginBottom: "18px",
            }}
          >
            <label style={styles.label}>
              Entry title *
              <input
                style={styles.input}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="e.g. Daily health check"
                maxLength={150}
                required
              />
            </label>

            <label style={styles.label}>
              Mood
              <select
                style={styles.input}
                value={form.mood}
                onChange={(event) =>
                  setForm({ ...form, mood: event.target.value })
                }
              >
                {moods.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Entry date
              <input
                type="date"
                style={styles.input}
                value={form.entryDate}
                onChange={(event) =>
                  setForm({ ...form, entryDate: event.target.value })
                }
                required
              />
            </label>

            <label style={styles.label}>
              Tags
              <input
                style={styles.input}
                value={form.tags}
                onChange={(event) =>
                  setForm({ ...form, tags: event.target.value })
                }
                placeholder="sleep, exercise, daily-check"
              />
            </label>
          </div>

          <label style={styles.label}>
            Notes
            <textarea
              style={{ ...styles.input, minHeight: "120px", resize: "vertical" }}
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              placeholder="Write about your day, activities, or health observations..."
              maxLength={10000}
            />
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "18px",
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.button,
                border: "1px solid #2563eb",
                background: saving ? "#93c5fd" : "#2563eb",
                color: "#ffffff",
                opacity: saving ? 0.75 : 1,
              }}
            >
              {editingId ? <Save size={16} /> : <Plus size={16} />}
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Entry"
                  : "Save Entry"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 5px", color: "#0f172a", fontSize: "19px" }}>
              Your Entries ({entries.length})
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
              Your saved health journal records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadEntries()}
            disabled={loading}
            style={{
              ...styles.button,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
            }}
          >
            <RefreshCw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div style={{ ...styles.panel, color: "#64748b" }}>
            Loading journal entries...
          </div>
        ) : entries.length === 0 ? (
          <div
            style={{
              ...styles.panel,
              textAlign: "center",
              padding: "42px 24px",
            }}
          >
            <BookHeart size={36} color="#94a3b8" />
            <h3 style={{ color: "#334155", marginBottom: "8px" }}>
              No journal entries yet
            </h3>
            <p style={{ color: "#64748b", margin: 0, lineHeight: 1.7 }}>
              Create your first entry above. It will be saved to your
              PostgreSQL database.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {entries.map((entry) => (
              <article
                key={entry.id}
                style={{
                  ...styles.panel,
                  marginBottom: 0,
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                    <h4
                      style={{
                        margin: "0 0 9px",
                        color: "#0f172a",
                        fontSize: "17px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {entry.title}
                    </h4>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "9px",
                        marginBottom: "12px",
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <CalendarDays size={14} />
                        {formatDate(entry.entry_date)}
                      </span>

                      {entry.mood && (
                        <span
                          style={{
                            padding: "4px 9px",
                            borderRadius: "20px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            fontWeight: 600,
                          }}
                        >
                          {entry.mood}
                        </span>
                      )}
                    </div>

                    {entry.notes && (
                      <p
                        style={{
                          margin: "0 0 13px",
                          color: "#475569",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {entry.notes}
                      </p>
                    )}

                    {entry.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                        {entry.tags.map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            style={{
                              padding: "5px 9px",
                              borderRadius: "6px",
                              background: "#f1f5f9",
                              color: "#475569",
                              fontSize: "11px",
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      aria-label={`Edit ${entry.title}`}
                      title="Edit entry"
                      onClick={() => handleEdit(entry)}
                      style={{
                        ...styles.button,
                        padding: "9px",
                        border: "1px solid #bfdbfe",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                      }}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      aria-label={`Delete ${entry.title}`}
                      title="Delete entry"
                      onClick={() => void handleDelete(entry)}
                      style={{
                        ...styles.button,
                        padding: "9px",
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#b91c1c",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p
        style={{
          margin: "22px 0 0",
          color: "#94a3b8",
          fontSize: "12px",
          lineHeight: 1.6,
        }}
      >
        Health journal entries are personal records, not a medical diagnosis.
        Avoid entering information you do not want stored in this application.
      </p>
    </div>
  );
}
