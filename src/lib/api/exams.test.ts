import { describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("./client", () => ({ apiClient: { get } }));

import { fetchExam, fetchTestExam } from "./exams";

describe("fetchExam", () => {
  it("requests the country exam with seed and version params", async () => {
    get.mockResolvedValue({ data: { seed: "s" } });
    expect(await fetchExam("us", { seed: "s", version: "2008" })).toEqual({ seed: "s" });
    expect(get).toHaveBeenCalledWith("/exams/us", { params: { seed: "s", version: "2008" } });
  });

  it("requests an admin-published test by slug", async () => {
    get.mockResolvedValue({ data: { seed: "t" } });
    expect(await fetchTestExam("my-test", { seed: "t" })).toEqual({ seed: "t" });
    expect(get).toHaveBeenCalledWith("/tests/my-test", { params: { seed: "t" } });
  });
});
