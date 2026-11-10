import { describe, expect, it } from "vitest";
import {
  emptyQuestionForm,
  formatOptions,
  fromQuestion,
  parseOptions,
  toQuestionPayload,
} from "./question-form";

describe("parseOptions / formatOptions", () => {
  it("parses 'id: text' lines", () => {
    expect(parseOptions("a: 1066\nb: 1215")).toEqual([
      { id: "a", text: "1066" },
      { id: "b", text: "1215" },
    ]);
  });
  it("auto-assigns ids to plain lines and skips blanks", () => {
    expect(parseOptions("Wales\n\n  Scotland  ")).toEqual([
      { id: "a", text: "Wales" },
      { id: "b", text: "Scotland" },
    ]);
  });
  it("keeps colons inside option text", () => {
    expect(parseOptions("a: Time: 10:30")).toEqual([{ id: "a", text: "Time: 10:30" }]);
  });
  it("round-trips", () => {
    const opts = [
      { id: "a", text: "X" },
      { id: "b", text: "Y" },
    ];
    expect(parseOptions(formatOptions(opts))).toEqual(opts);
  });
});

describe("toQuestionPayload", () => {
  it("converts form text fields into API arrays", () => {
    const payload = toQuestionPayload({
      ...emptyQuestionForm,
      countryCode: "us",
      versions: "2025, 2008",
      chapterId: "c1",
      type: "shorttext",
      prompt: " Supreme law? ",
      accepted: "the Constitution\nConstitution\n",
      tags: "civics, core",
      sourceRef: "USCIS",
      difficulty: 2,
      status: "published",
    });
    expect(payload).toMatchObject({
      versions: ["2025", "2008"],
      prompt: "Supreme law?",
      acceptedAnswers: ["the Constitution", "Constitution"],
      tags: ["civics", "core"],
      options: [],
      correctOptionIds: [],
    });
  });
  it("sends options and correct ids for choice questions only", () => {
    const payload = toQuestionPayload({
      ...emptyQuestionForm,
      type: "single",
      options: "a: A\nb: B",
      correct: "a",
      accepted: "ignored",
    });
    expect(payload.options).toHaveLength(2);
    expect(payload.correctOptionIds).toEqual(["a"]);
    expect(payload.acceptedAnswers).toEqual([]);
  });
});

describe("fromQuestion", () => {
  it("maps an API question back to form state", () => {
    const form = fromQuestion({
      id: "q1",
      countryCode: "uk",
      versions: ["v1", "v2"],
      chapterId: "c1",
      type: "single",
      prompt: "P",
      options: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
      ],
      correctOptionIds: ["b"],
      acceptedAnswers: [],
      sourceRef: "r",
      tags: ["t"],
      difficulty: 3,
      status: "published",
    });
    expect(form).toMatchObject({
      versions: "v1, v2",
      correct: "b",
      options: "a: A\nb: B",
      tags: "t",
      difficulty: 3,
    });
  });
});
