import type { DemoSession } from "./sessionStorage";

export function exportSessionsToCSV(
  sessions: DemoSession[],
): void {
  if (sessions.length === 0) {
    window.alert("No saved demo sessions are available to export.");
    return;
  }

  const headers = [
    "Session ID",
    "Session Date",
    "Duration",
    "Illustrative Heart Rate (BPM)",
    "Data Type",
  ];

  const escapeCSV = (value: string | number): string => {
    const text = String(value);

    // Quote fields containing commas, quotes, or line breaks.
    return `"${text.replace(/"/g, '""')}"`;
  };

  const rows = sessions.map((session) => {
    const minutes = Math.floor(session.durationSeconds / 60);
    const seconds = session.durationSeconds % 60;

    const duration =
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;

    return [
      session.id,
      session.date,
      duration,
      session.heartRate,
      session.dataType,
    ];
  });

  const csvContent = [
    ["PulseCare — SIMULATED DEMONSTRATION DATA"],
    [],
    headers,
    ...rows,
  ]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  // UTF-8 BOM improves compatibility with spreadsheet software.
  const blob = new Blob(["\uFEFF", csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const downloadURL = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadURL;
  link.download = `pulsecare-demo-sessions-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(downloadURL);
}