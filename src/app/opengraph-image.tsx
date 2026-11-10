import { ImageResponse } from "next/og";
import { OG_IMAGE } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/schema";

export const alt = OG_IMAGE.alt;
export const size = { width: OG_IMAGE.width, height: OG_IMAGE.height };
export const contentType = "image/png";

/** Default share image for every route. Generated once at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#0f172a",
        color: "#f8fafc",
      }}
    >
      <div style={{ fontSize: 36, opacity: 0.8 }}>{SITE_NAME}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
          Free citizenship test practice
        </div>
        <div style={{ fontSize: 40, opacity: 0.9 }}>
          United States · United Kingdom · Canada · Australia
        </div>
      </div>
      <div style={{ fontSize: 28, opacity: 0.7 }}>
        Independent study resource. Not affiliated with any government.
      </div>
    </div>,
    size,
  );
}
