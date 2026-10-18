export interface DemoSession {
  id: string;
  date: string;
  durationSeconds: number;
  heartRate: number;
  dataType: "SIMULATED";
}

const STORAGE_KEY = "pulsecare_demo_sessions";

/**
 * Validate an individual session record.
 */
function isValidSession(item: unknown): item is DemoSession {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const session = item as Record<string, unknown>;

  return (
    typeof session.id === "string" &&
    session.id.trim().length > 0 &&
    typeof session.date === "string" &&
    session.date.trim().length > 0 &&
    Number.isFinite(Date.parse(session.date)) &&
    typeof session.durationSeconds === "number" &&
    Number.isFinite(session.durationSeconds) &&
    session.durationSeconds >= 0 &&
    typeof session.heartRate === "number" &&
    Number.isFinite(session.heartRate) &&
    session.heartRate >= 0 &&
    session.dataType === "SIMULATED"
  );
}

/**
 * Safely access browser local storage.
 * Returns null if storage is unavailable.
 */
function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  } catch {
    console.error("Browser storage is unavailable.");
    return null;
  }
}

/**
 * Retrieve saved demonstration sessions.
 */
export function getSessions(): DemoSession[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  try {
    const storedData = storage.getItem(STORAGE_KEY);

    if (!storedData) {
      return [];
    }

    const parsedData: unknown = JSON.parse(storedData);

    if (!Array.isArray(parsedData)) {
      console.error("Stored session data is not a valid list.");
      return [];
    }

    return parsedData.filter(isValidSession);
  } catch {
    console.error("Unable to retrieve demo sessions.");
    return [];
  }
}

/**
 * Save a completed demonstration session.
 *
 * Throws an error if validation fails or browser storage
 * cannot save the updated session list.
 */
export function saveSession(
  session: DemoSession,
): DemoSession[] {
  if (!isValidSession(session)) {
    throw new Error(
      "Invalid demonstration session. The session was not saved.",
    );
  }

  const storage = getStorage();

  if (!storage) {
    throw new Error(
      "Browser storage is unavailable. The session was not saved.",
    );
  }

  try {
    const storedData = storage.getItem(STORAGE_KEY);
    let existingSessions: DemoSession[] = [];

    if (storedData) {
      const parsedData: unknown = JSON.parse(storedData);

      if (!Array.isArray(parsedData)) {
        throw new Error("Stored session data is invalid.");
      }

      existingSessions = parsedData.filter(isValidSession);
    }

    const updatedSessions = [
      session,
      ...existingSessions.filter(
        (item) => item.id !== session.id,
      ),
    ];

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedSessions),
    );

    return updatedSessions;
  } catch (error) {
    console.error("Unable to save demo session.");

    if (error instanceof Error &&
        error.message === "Stored session data is invalid.") {
      throw error;
    }

    throw new Error(
      "Unable to save the session. Check browser storage availability.",
    );
  }
}

/**
 * Delete a saved demonstration session.
 *
 * Throws an error if browser storage cannot complete
 * the deletion.
 */
export function deleteSession(id: string): DemoSession[] {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new Error("A valid session ID is required.");
  }

  const storage = getStorage();

  if (!storage) {
    throw new Error(
      "Browser storage is unavailable. The session was not deleted.",
    );
  }

  try {
    const storedData = storage.getItem(STORAGE_KEY);
    let existingSessions: DemoSession[] = [];

    if (storedData) {
      const parsedData: unknown = JSON.parse(storedData);

      if (!Array.isArray(parsedData)) {
        throw new Error("Stored session data is invalid.");
      }

      existingSessions = parsedData.filter(isValidSession);
    }

    const updatedSessions = existingSessions.filter(
      (session) => session.id !== id,
    );

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedSessions),
    );

    return updatedSessions;
  } catch (error) {
    console.error("Unable to delete demo session.");

    if (error instanceof Error &&
        error.message === "Stored session data is invalid.") {
      throw error;
    }

    throw new Error(
      "Unable to delete the session. Check browser storage availability.",
    );
  }
}

/**
 * Format elapsed seconds as MM:SS.
 */
export function formatSessionDuration(
  seconds: number,
): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}