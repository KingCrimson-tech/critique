import { ImageResponse } from "next/og";
import { resolveShareLink } from "@/lib/scans";

export const runtime = "nodejs";

// 1200×630 share card: score numeral, verdict, target host. Ink on paper.
export async function GET(_request, { params }) {
  const { slug } = await params;
  const scan = await resolveShareLink(slug);
  if (!scan) return new Response("Not found", { status: 404 });

  const host = new URL(scan.url).host;
  const overall = scan.score.overall;
  const color = overall >= 80 ? "#1E6B4E" : overall >= 50 ? "#B26A00" : "#D93A1F";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F4F1EA",
          color: "#0B0B0C",
          padding: "56px 64px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
            Critique<span style={{ color: "#D93A1F" }}>.</span>
          </div>
          <div style={{ display: "flex", fontSize: 20, color: "#0B0B0C", opacity: 0.55 }}>
            {new Date(scan.createdAt).toISOString().slice(0, 10)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 220,
                fontWeight: 700,
                lineHeight: 1,
                color,
              }}
            >
              {overall}
            </div>
            <div style={{ display: "flex", width: 280, height: 6, backgroundColor: "#0B0B0C", marginTop: 24 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
              {scan.score.verdict.title}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#0B0B0C", opacity: 0.65 }}>
              {scan.findings.length} findings · {(scan.stats.elapsedMs / 1000).toFixed(1)}s scan
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderTop: "2px solid #0B0B0C",
            paddingTop: 20,
          }}
        >
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>{host}</div>
          <div style={{ display: "flex", fontSize: 20, color: "#0B0B0C", opacity: 0.55 }}>
            blunt audits · free, no tiers, no gate
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
