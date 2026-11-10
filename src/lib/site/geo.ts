import type { CountryCode } from "@/lib/engine/types";

const BY_ISO: Record<string, CountryCode> = { GB: "uk", US: "us", CA: "ca", AU: "au" };

/** Maps a geo-IP header (ISO 3166-1 alpha-2) to a country to highlight. Never used to redirect. */
export function suggestedCountry(iso: string | null | undefined): CountryCode | null {
  return (iso && BY_ISO[iso.toUpperCase()]) || null;
}
