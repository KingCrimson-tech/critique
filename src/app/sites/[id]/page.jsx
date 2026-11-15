import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getViewerFromHeaders, listSiteHistory } from "@/lib/scans";
import { RescanButton } from "@/components/dashboard/rescan-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Scan history" };

export default async function SiteHistoryPage({ params }) {
  const { id } = await params;
  const viewer = await getViewerFromHeaders();
  if (!viewer.sessionUser) redirect("/login");
  const history = await listSiteHistory(id, viewer.sessionUser.id);
  if (!history) notFound();

  const { site, scans } = history;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <Link
            href="/sites"
            className="font-mono text-[11px] uppercase tracking-widest text-ink/50 hover:text-vermillion"
          >
            ← Your sites
          </Link>
          <h1 className="mt-2 font-display text-display tracking-tight">
            {site.origin.replace(/^https?:\/\//, "")}
          </h1>
        </div>
        <RescanButton siteId={site.id} origin={site.origin.replace(/^https?:\/\//, "")} size="md" />
      </div>

      {scans.length === 0 ? (
        <p className="mt-10 border border-hairline p-6 text-[15px] text-ink/70">
          No completed scans yet. Hit re-scan.
        </p>
      ) : (
        <table className="mt-8 w-full text-left">
          <thead>
            <tr className="border-b border-hairline-strong font-mono text-[11px] uppercase tracking-widest text-ink/50">
              <th className="py-2 pr-4">scanned</th>
              <th className="w-16 py-2 pr-4 text-right">score</th>
              <th className="w-28 py-2 pr-4">delta</th>
              <th className="w-40 py-2 pr-4">findings</th>
              <th className="w-24 py-2 text-right">report</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => (
              <tr key={scan.id} className="border-b border-hairline">
                <td className="py-3 pr-4 font-mono text-data text-ink/70">
                  {new Date(scan.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-3 pr-4 text-right font-display text-[22px]">
                  {scan.overall ?? "—"}
                </td>
                <td className="py-3 pr-4 font-mono text-[11px]">
                  {scan.delta === null || scan.delta === undefined ? (
                    <span className="text-ink/35">first scan</span>
                  ) : scan.delta === 0 ? (
                    <span className="text-ink/45">no change</span>
                  ) : scan.delta > 0 ? (
                    <span className="text-green">+{scan.delta}</span>
                  ) : (
                    <span className="text-vermillion">−{Math.abs(scan.delta)}</span>
                  )}
                </td>
                <td className="py-3 pr-4 font-mono text-data text-ink/60">
                  {scan.counts.critical}c · {scan.counts.high}h · {scan.counts.medium}m ·{" "}
                  {scan.counts.low}l
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/scan/${scan.id}`}
                    className="font-mono text-data text-ink/70 hover:text-vermillion"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
