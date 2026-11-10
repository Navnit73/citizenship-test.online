import type { CountryCode } from "@/lib/engine/types";

/** Display labels only. Exam rules live in the database, never here. */
export const COUNTRY_NAMES: Record<CountryCode, string> = {
  us: "United States",
  uk: "United Kingdom",
  ca: "Canada",
  au: "Australia",
};

export const COUNTRY_CODES = Object.keys(COUNTRY_NAMES) as CountryCode[];

export function isCountryCode(value: string): value is CountryCode {
  return Object.hasOwn(COUNTRY_NAMES, value);
}
