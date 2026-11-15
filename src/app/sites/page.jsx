import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewerFromHeaders, listSitesWithScores, claimAnonScans } from "@/lib/scans";
import { RescanButton } from "@/components/dashboard/rescan-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your sites" };

function DeltaChip({ delta }) {
  if (delta === null || delta === undefined) return null;
  if (delta === 0)
    return <span className="font-mono text-[11px] text-ink/45">no change</span>;
  const improved = delta > 0;
  return (
    <span
      className={`font-mono text-[11px] ${improved ? "text-green" : "text-vermillion"}`}
    >
      {improved ? "+" : "−"}
      {Math.abs(delta)} vs previous
    </span>
  );
}

export default async function SitesPage() {
  const viewer = await getViewerFromHeaders();
  if (!viewer.sessionUser) redirect("/login");

  // Claim scans this browser ran while signed out. Idempotent.
  const { claimed } = await claimAnonScans(viewer.sessionUser.id, viewer.anonToken);
  const sites = await listSitesWithScores(viewer.sessionUser.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-display tracking-tight">Your sites</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink/50">
            {viewer.sessionUser.email}
            {claimed > 0 && ` · claimed ${claimed} scan${claimed > 1 ? "s" : ""} from this browser`}
          </p>
        </div>
        <Link href="/" className="font-mono text-data text-ink/55 hover:text-vermillion">
          New audit →
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="mt-10 border border-hairline p-8">
          <p className="text-[15px] text-ink/70">
            No sites yet. Run an audit from the front page — signed in or not — and it lands here.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block font-mono text-data text-ink underline decoration-hairline-strong underline-offset-4 hover:text-vermillion"
          >
            Run the first audit →
          </Link>
        </div>
      ) : (
        <ul className="mt-8">
          {sites.map((site) => (
            <li key={site.id} className="border-t border-hairline py-5 last:border-b">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <span className="font-display text-[28px] leading-none">
                    {site.latest?.overall ?? "—"}
                  </span>
                  <div>
                    <Link
                      href={`/sites/${site.id}`}
                      className="font-mono text-[15px] hover:text-vermillion"
                    >
                      {site.origin.replace(/^https?:\/\//, "")}
                    </Link>
                    <p className="mt-0.5 flex gap-4 font-mono text-[11px] uppercase tracking-widest text-ink/45">
                      <span>
                        {site.latest
                          ? `${site.latest.criticals} critical`
                          : "no scans yet"}
                      </span>
                      {site.latest && (
                        <span>
                          {new Date(site.latest.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {site.latest && <DeltaChip delta={site.latest.delta} />}
                  {site.latest && (
                    <RescanButton
                      siteId={site.id}
                      origin={site.origin.replace(/^https?:\/\//, "")}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
