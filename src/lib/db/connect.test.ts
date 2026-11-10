import { beforeEach, describe, expect, it, vi } from "vitest";

const connect = vi.fn();
vi.mock("mongoose", () => ({ default: { connect } }));

async function load() {
  vi.resetModules();
  (globalThis as { _mongoose?: unknown })._mongoose = undefined;
  vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/x");
  return (await import("./connect")).connectDb;
}

describe("connectDb", () => {
  beforeEach(() => connect.mockReset());

  it("connects once and reuses the connection", async () => {
    const conn = { name: "conn" };
    connect.mockResolvedValue(conn);
    const connectDb = await load();
    expect(await connectDb()).toBe(conn);
    expect(await connectDb()).toBe(conn);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("allows retry after a failed connection", async () => {
    connect.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({ ok: 1 });
    const connectDb = await load();
    await expect(connectDb()).rejects.toThrow("boom");
    await expect(connectDb()).resolves.toEqual({ ok: 1 });
  });
});
