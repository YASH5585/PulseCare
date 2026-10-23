const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api").replace(/\/+$/, "");

export interface JournalEntry {
  id: string;
  title: string;
  notes: string;
  mood: string | null;
  tags: string[];
  entry_date: string;
  created_at: string;
  updated_at: string;
}

interface JournalListResponse {
  success: boolean;
  entries: JournalEntry[];
}

interface JournalEntryResponse {
  success: boolean;
  message?: string;
  entry: JournalEntry;
}

interface JournalMessageResponse {
  success: boolean;
  message: string;
}

export interface JournalEntryInput {
  title: string;
  notes: string;
  mood: string | null;
  tags: string[];
  entryDate?: string;
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

export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const response = await fetch(`${API_BASE_URL}/journal`);

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = (await response.json()) as JournalListResponse;

  if (!body.success || !Array.isArray(body.entries)) {
    throw new Error("The server returned an invalid journal response.");
  }

  return body.entries;
}

export async function createJournalEntry(
  entry: JournalEntryInput,
): Promise<JournalEntry> {
  const response = await fetch(`${API_BASE_URL}/journal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = (await response.json()) as JournalEntryResponse;

  if (!body.success || !body.entry) {
    throw new Error("The server returned an invalid journal entry.");
  }

  return body.entry;
}

export async function updateJournalEntry(
  id: string,
  entry: Partial<JournalEntryInput>,
): Promise<JournalEntry> {
  const response = await fetch(
    `${API_BASE_URL}/journal/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = (await response.json()) as JournalEntryResponse;

  if (!body.success || !body.entry) {
    throw new Error("The server returned an invalid journal update.");
  }

  return body.entry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/journal/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = (await response.json()) as JournalMessageResponse;

  if (!body.success) {
    throw new Error("The server could not delete the journal entry.");
  }
}
