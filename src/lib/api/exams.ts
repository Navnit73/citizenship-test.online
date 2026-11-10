import type { ExamPayload } from "@/lib/exam";
import type { CountryCode } from "@/lib/engine/types";
import { apiClient } from "./client";

export async function fetchExam(
  country: CountryCode,
  opts: { seed?: string; version?: string } = {},
): Promise<ExamPayload> {
  const { data } = await apiClient.get<ExamPayload>(`/exams/${country}`, { params: opts });
  return data;
}

export async function fetchTestExam(
  slug: string,
  opts: { seed?: string } = {},
): Promise<ExamPayload> {
  const { data } = await apiClient.get<ExamPayload>(`/tests/${slug}`, { params: opts });
  return data;
}
