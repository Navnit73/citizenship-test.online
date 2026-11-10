"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getConsentRaw,
  onConsentPrompt,
  parseConsent,
  requestConsentPrompt,
  setConsent,
  subscribeConsent,
} from "@/lib/consent";

const SERVER = "__server__";

export function CookieBanner() {
  const raw = useSyncExternalStore(subscribeConsent, getConsentRaw, () => SERVER);
  const [reopened, setReopened] = useState(false);
  useEffect(() => onConsentPrompt(() => setReopened(true)), []);

  const undecided = raw !== SERVER && parseConsent(raw) === null;
  if (!(undecided || (reopened && raw !== SERVER))) return null;

  const choose = (analytics: boolean) => {
    setConsent(analytics);
    setReopened(false);
  };
  // Identical styling on purpose: rejecting must be as easy as accepting.
  const btn = "btn btn-outline btn-sm";

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-base-300 bg-base-100 p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm">
          We&apos;d like to use analytics cookies to see which pages help learners. Nothing is
          loaded unless you accept. You can change your choice at any time.
        </p>
        <div className="flex gap-2">
          <button type="button" className={btn} onClick={() => choose(false)}>
            Reject analytics
          </button>
          <button type="button" className={btn} onClick={() => choose(true)}>
            Accept analytics
          </button>
        </div>
      </div>
    </section>
  );
}

export function CookieSettingsButton() {
  return (
    <button type="button" className="link link-hover" onClick={requestConsentPrompt}>
      Cookie settings
    </button>
  );
}
