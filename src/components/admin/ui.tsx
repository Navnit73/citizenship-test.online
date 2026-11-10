"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api/client";

export const errMessage = (e: unknown) =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Something went wrong";

/** Loads data on mount / when deps change; `reload()` refetches. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(deps);
  useEffect(() => {
    let cancelled = false;
    fn()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => !cancelled && setError(errMessage(e)));
    return () => {
      cancelled = true;
    };
    // `fn` is intentionally keyed by `deps` (callers pass inline closures).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);
  return {
    data,
    error,
    loading: data === null && error === null,
    reload: () => setTick((t) => t + 1),
  };
}

export function ErrorAlert({ error }: { error: string | null }) {
  return error ? (
    <div role="alert" className="alert alert-error my-3">
      {error}
    </div>
  ) : null;
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="alert alert-success my-3">
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs opacity-80">{hint}</span>}
    </label>
  );
}

export const inputCls = "input input-bordered w-full";
export const selectCls = "select select-bordered w-full";
export const textareaCls = "textarea textarea-bordered w-full";

export function Loading() {
  return (
    <p role="status" className="flex items-center gap-2">
      <span className="loading loading-spinner" aria-hidden="true" /> Loading…
    </p>
  );
}
