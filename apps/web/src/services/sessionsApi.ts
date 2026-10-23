const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api").replace(/\/+$/, "");

export interface MonitoringSession {
  id: string;
  started_at: string;
  duration_seconds: number;
  heart_rate: number;
  data_type: "SIMULATED" | "DEVICE";
  created_at: string;
}

interface SessionsResponse {
  success: boolean;
  sessions: MonitoringSession[];
  message?: string;
}

interface SessionResponse {
  success: boolean;
  session: MonitoringSession;
  message?: string;
}

export interface CreateMonitoringSessionInput {
  id: string;
  startedAt: string;
  durationSeconds: number;
  heartRate: number;
  dataType: "SIMULATED" | "DEVICE";
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
    ) {
      return body.message;
    }
  } catch {
    // Use the fallback message if the response isn't valid JSON.
  }

  return `Request failed with status ${response.status}.`;
}

export async function fetchMonitoringSessions(): Promise<MonitoringSession[]> {
  const response = await fetch(`${API_BASE_URL}/sessions`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body = (await response.json()) as SessionsResponse;

  if (!body.success || !Array.isArray(body.sessions)) {
    throw new Error("The server returned an invalid sessions response.");
  }

  return body.sessions;
}

export async function createMonitoringSession(
  session: CreateMonitoringSessionInput,
): Promise<MonitoringSession> {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body = (await response.json()) as SessionResponse;

  if (!body.success || !body.session) {
    throw new Error("The server returned an invalid saved session.");
  }

  return body.session;
}

export async function deleteMonitoringSession(id: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/sessions/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function clearSimulatedMonitoringSessions(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

