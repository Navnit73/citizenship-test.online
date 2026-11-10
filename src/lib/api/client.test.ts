import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient } from "./client";

function respond(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): Promise<AxiosResponse> {
  const res = { data, status, statusText: "", headers: {}, config };
  return status >= 200 && status < 300
    ? Promise.resolve(res)
    : Promise.reject(
        Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, config, response: res }),
      );
}

describe("apiClient", () => {
  it("retries 5xx responses then succeeds", async () => {
    const adapter = vi
      .fn<AxiosAdapter>()
      .mockImplementationOnce((c) => respond(c, 503, {}))
      .mockImplementationOnce((c) => respond(c, 200, { ok: true }));
    const client = createApiClient({ adapter, retries: 2, retryDelayMs: 0 });
    expect((await client.get("/x")).data).toEqual({ ok: true });
    expect(adapter).toHaveBeenCalledTimes(2);
  });
  it("gives up after the retry budget and normalises the error", async () => {
    const adapter = vi.fn<AxiosAdapter>((c) => respond(c, 500, { error: "boom" }));
    const client = createApiClient({ adapter, retries: 2, retryDelayMs: 0 });
    await expect(client.get("/x")).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
      message: "boom",
    });
    expect(adapter).toHaveBeenCalledTimes(3);
  });
  it("does not retry 4xx", async () => {
    const adapter = vi.fn<AxiosAdapter>((c) => respond(c, 400, { error: "bad" }));
    const client = createApiClient({ adapter, retries: 2, retryDelayMs: 0 });
    await expect(client.get("/x")).rejects.toBeInstanceOf(ApiError);
    expect(adapter).toHaveBeenCalledTimes(1);
  });
  it("normalises network errors", async () => {
    const adapter = vi.fn<AxiosAdapter>(() =>
      Promise.reject(Object.assign(new Error("down"), { isAxiosError: true })),
    );
    const client = createApiClient({ adapter, retries: 0 });
    await expect(client.get("/x")).rejects.toMatchObject({ status: 0 });
  });
});
