import { requiredCorrect } from "@/lib/engine/scoring";
import type { ExamVersion } from "@/lib/engine/types";

export type ExamDescription = {
  questions: string;
  passMark: string;
  time: string;
  pool: string;
  notes: string[];
};

/** Plain-language summary derived from the DB rules, so copy can never drift from the engine. */
export function describeExam(v: ExamVersion): ExamDescription {
  const n = v.questionsAsked;
  const passMark =
    v.passRule.type === "percent"
      ? `${v.passRule.value}% (${requiredCorrect(v)} of ${n})`
      : `${v.passRule.value} of ${n}`;
  const notes: string[] = [];
  if (v.stopWhenPassed) notes.push("The test stops as soon as you pass or can no longer pass.");
  for (const r of v.requiredTags ?? []) {
    if (r.mustAllBeCorrect) notes.push(`You must answer every “${r.tag}” question correctly.`);
  }
  return {
    questions: `${n} questions`,
    passMark,
    time: v.timeLimitSec ? `${Math.round(v.timeLimitSec / 60)} minutes` : "No fixed time limit",
    pool: `Up to ${n} questions drawn from a pool of ${v.poolSize}`,
    notes,
  };
}

export type FaqItem = { q: string; a: string };

export function buildCountryFaq(opts: {
  countryName: string;
  testName: string;
  version: ExamVersion;
  officialUrl: string;
}): FaqItem[] {
  const d = describeExam(opts.version);
  const notes = d.notes.length ? ` ${d.notes.join(" ")}` : "";
  return [
    {
      q: `How many questions are on the ${opts.testName}?`,
      a: `You are asked ${d.questions}. ${d.pool}.`,
    },
    { q: "What is the pass mark?", a: `The pass mark is ${d.passMark}.${notes}` },
    {
      q: "How long does the test take?",
      a: d.time === "No fixed time limit" ? "There is no fixed time limit." : `You have ${d.time}.`,
    },
    {
      q: "Is this practice test free?",
      a: "Yes. Practice tests are free to use and you do not need an account.",
    },
    {
      q: `Is this the official ${opts.testName}?`,
      a: `No. citizenship-test.online is not affiliated with the government of ${opts.countryName}. Always check the official source for the latest rules: ${opts.officialUrl}`,
    },
  ];
}
