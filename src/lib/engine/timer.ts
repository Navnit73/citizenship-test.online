export function remainingSeconds(startedAtMs: number, limitSec: number, nowMs: number): number {
  return Math.max(0, limitSec - Math.floor((nowMs - startedAtMs) / 1000));
}

type CountdownOptions = {
  limitSec: number;
  onExpire: () => void;
  onTick?: (remainingSec: number) => void;
};

/** Mock-mode countdown: deliberately has no pause; auto-submits via onExpire. */
export function createCountdown({ limitSec, onExpire, onTick }: CountdownOptions) {
  const startedAt = Date.now();
  const id = setInterval(() => {
    const left = remainingSeconds(startedAt, limitSec, Date.now());
    onTick?.(left);
    if (left === 0) {
      clearInterval(id);
      onExpire();
    }
  }, 1000);
  return { stop: () => clearInterval(id) };
}
