import type { Consent } from "./consent";

/** GA4 measurement ids only; anything else could be injected into an inline script. */
export const GA_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;

export function shouldLoadAnalytics(consent: Consent | null, id: string | undefined): boolean {
  return !!consent?.analytics && !!id && GA_ID_PATTERN.test(id);
}
