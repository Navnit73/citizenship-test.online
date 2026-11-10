import type { CountryCode } from "@/lib/engine/types";

export type GuestAttempt = {
  id: string;
  countryCode: CountryCode;
  seed: string;
  score: number;
  total: number;
  passed: boolean;
  mode: "read" | "listen" | "write";
  startedAt: number;
  finishedAt: number;
  answers: { questionId: string; response: string[] | string; correct: boolean; timeMs: number }[];
};

const ID_KEY = "ct.guest.id";
const ATTEMPTS_KEY = "ct.guest.attempts";
const MAX_ATTEMPTS = 50;

// Storage can throw (private mode, blocked cookies): never let it break the app.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function getGuestId(): string {
  let id = read(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    write(ID_KEY, id);
  }
  return id;
}

export function listGuestAttempts(): GuestAttempt[] {
  try {
    const parsed = JSON.parse(read(ATTEMPTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestAttempt(attempt: GuestAttempt) {
  write(ATTEMPTS_KEY, JSON.stringify([attempt, ...listGuestAttempts()].slice(0, MAX_ATTEMPTS)));
}
