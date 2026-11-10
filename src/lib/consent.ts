const KEY = "ct.consent";
const CHANGE_EVENT = "ct:consent-change";
const REOPEN_EVENT = "ct:consent-reopen";

export type Consent = { analytics: boolean };

export function parseConsent(raw: string | null): Consent | null {
  try {
    const parsed = JSON.parse(raw ?? "null");
    return parsed && typeof parsed.analytics === "boolean" ? { analytics: parsed.analytics } : null;
  } catch {
    return null;
  }
}

/** Raw stored value; a stable string so it works as a useSyncExternalStore snapshot. */
export function getConsentRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export const getConsent = () => parseConsent(getConsentRaw());

export function setConsent(analytics: boolean): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ analytics }));
  } catch {
    /* storage blocked: the choice simply won't persist */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeConsent(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export const requestConsentPrompt = () => window.dispatchEvent(new Event(REOPEN_EVENT));

export function onConsentPrompt(callback: () => void): () => void {
  window.addEventListener(REOPEN_EVENT, callback);
  return () => window.removeEventListener(REOPEN_EVENT, callback);
}
