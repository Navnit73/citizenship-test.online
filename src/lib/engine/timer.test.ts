import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCountdown, remainingSeconds } from "./timer";

describe("remainingSeconds", () => {
  it("counts down and clamps at zero", () => {
    expect(remainingSeconds(0, 60, 10_000)).toBe(50);
    expect(remainingSeconds(0, 60, 90_000)).toBe(0);
  });
});

describe("createCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("auto-submits (calls onExpire once) at zero", () => {
    const onExpire = vi.fn();
    createCountdown({ limitSec: 5, onExpire });
    vi.advanceTimersByTime(4_000);
    expect(onExpire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10_000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
  it("reports remaining seconds on each tick", () => {
    const ticks: number[] = [];
    createCountdown({ limitSec: 3, onTick: (s) => ticks.push(s), onExpire: () => {} });
    vi.advanceTimersByTime(3_000);
    expect(ticks).toEqual([2, 1, 0]);
  });
  it("does not expire after stop()", () => {
    const onExpire = vi.fn();
    const t = createCountdown({ limitSec: 2, onExpire });
    t.stop();
    vi.advanceTimersByTime(5_000);
    expect(onExpire).not.toHaveBeenCalled();
  });
});
