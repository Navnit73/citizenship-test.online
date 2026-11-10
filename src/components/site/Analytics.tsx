"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { shouldLoadAnalytics } from "@/lib/analytics";
import { getConsentRaw, parseConsent, subscribeConsent } from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** Loads GA4 only after the visitor has explicitly accepted analytics. */
export function Analytics() {
  const raw = useSyncExternalStore(subscribeConsent, getConsentRaw, () => null);
  if (!shouldLoadAnalytics(parseConsent(raw), GA_ID)) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
