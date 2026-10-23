import type { DemoSession } from "../utils/sessionStorage";

const API_BASE_URL = "http://localhost:3001/api";

interface ApiSession {
  id: string;
  started_at: string;
  duration_seconds: number;
  heart_rate: number;
  data_type: "SIMULATED" | "DEVICE";
  created_at: string;
}

interface SessionsResponse {
  success: boolean;
  sessions: ApiSession[];
}

interface SessionResponse {
  success: boolean;
  message: string;
  session: ApiSession;
}

interface ApiMessageResponse {
  success: boolean;
  message: string;
}

function toDemoSession(session: ApiSession): DemoSession {
  return {
    id: session.id,
    date: session.started_at,
    durationSeconds: session.duration_seconds,
    heartRate: session.heart_rate,
    dataType: "SIMULATED",
  };
}

async function readError(response: Response): Promise<string> {
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
    // Use the default message when the response isn't valid JSON.
  }

  return `Request failed with status ${response.status}.`;
}

export async function fetchSessions(): Promise<DemoSession[]> {
  const response = await fetch(`${API_BASE_URL}/sessions`);

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = (await response.json()) as SessionsResponse;

  if (!body.success || !Array.isArray(body.sessions)) {
    throw new Error("The server returned an invalid sessions response.");
  }

  return body.sessions.map(toDemoSession);
}

export async function createSession(
  session: DemoSession,
): Promise<DemoSession> {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: session.id,
      startedAt: session.date,
      durationSeconds: session.durationSeconds,
      heartRate: session.heartRate,
      dataType: session.dataType,
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = (await response.json()) as SessionResponse;

  if (!body.success || !body.session) {
    throw new Error("The server returned an invalid save response.");
  }

  return toDemoSession(body.session);
}

export async function removeSession(
  id: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/sessions/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = (await response.json()) as ApiMessageResponse;

  if (!body.success) {
    throw new Error("The server could not delete the session.");
  }
}

export async function removeAllSessions(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = (await response.json()) as ApiMessageResponse;

  if (!body.success) {
    throw new Error("The server could not delete all sessions.");
  }
}
