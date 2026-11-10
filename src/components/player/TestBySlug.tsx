"use client";

import { fetchTestExam } from "@/lib/api/exams";
import type { CountryCode } from "@/lib/engine/types";
import { TestPlayer } from "./TestPlayer";

/** Client wrapper so a server page can start an admin-published test by slug. */
export function TestBySlug({ slug, country }: { slug: string; country: CountryCode }) {
  return <TestPlayer country={country} loadExam={() => fetchTestExam(slug)} />;
}
