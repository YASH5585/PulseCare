export interface DemoSession {
  id: string;
  date: string;
  durationSeconds: number;
  heartRate: number;
  dataType: "SIMULATED";
}

const STORAGE_KEY = "pulsecare_demo_sessions";

// Retrieve saved demo sessions.
export function getSessions(): DemoSession[] {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (!storedData) {
      return [];
    }

    const parsedData: unknown = JSON.parse(storedData);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData.filter(
      (item): item is DemoSession =>
        typeof item.id === "string" &&
        typeof item.date === "string" &&
        typeof item.durationSeconds === "number" &&
        typeof item.heartRate === "number" &&
        item.dataType === "SIMULATED",
    );
  } catch {
    console.error("Unable to retrieve demo sessions.");
    return [];
  }
}

// Save a completed demo session.
export function saveSession(
  session: DemoSession,
): DemoSession[] {
  const existingSessions = getSessions();

  const updatedSessions = [
    session,
    ...existingSessions.filter(
      (item) => item.id !== session.id,
    ),
  ];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedSessions),
  );

  return updatedSessions;
}

// Delete a saved demo session.
export function deleteSession(id: string): DemoSession[] {
  const updatedSessions = getSessions().filter(
    (session) => session.id !== id,
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedSessions),
  );

  return updatedSessions;
}

// Format elapsed seconds as MM:SS.
export function formatSessionDuration(
  seconds: number,
): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}