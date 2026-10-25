import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** The default social card: name, role and bio, set like the site — black on white, one red dot. */
export async function GET() {
  const s = await getSettings();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          background: "#ffffff",
          color: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#6b6b6b" }}>
          <div style={{ width: 12, height: 12, borderRadius: 12, background: "#e5484d" }} />
          {s.role}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 96, fontWeight: 500, letterSpacing: -3, lineHeight: 1 }}>{s.name}</div>
          <div style={{ fontSize: 34, lineHeight: 1.35, color: "#6b6b6b", maxWidth: 900 }}>{s.bio}</div>
        </div>
        <div style={{ fontSize: 22, color: "#8a8a8a" }}>{SITE_URL.replace(/^https?:\/\//, "")}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
