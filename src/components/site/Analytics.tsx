"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { shouldLoadAnalytics } from "@/lib/analytics";
import { getConsentRaw, parseConsent, subscribeConsent } from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = "zbiiqquoeq";

/** Loads GA4 and Microsoft Clarity only after the visitor has explicitly accepted analytics. */
export function Analytics() {
  const raw = useSyncExternalStore(subscribeConsent, getConsentRaw, () => null);
  const consent = parseConsent(raw);
  if (!consent?.analytics) return null;
  return (
    <>
      {shouldLoadAnalytics(consent, GA_ID) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      <Script id="clarity-init" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
      </Script>
    </>
  );
}
