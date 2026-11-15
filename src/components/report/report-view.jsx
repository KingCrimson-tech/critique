"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScoreHeader, CategoryRail, StackPanel, TopCosts } from "./overview";
import { FindingsTable } from "./findings-table";
import { LabPanel } from "./lab-panel";
import { ShareMenu } from "./share-menu";
import { DiffStrip } from "./diff-strip";

function PagesTab({ scan }) {
  return (
    <div>
      <ScrollArea className="max-h-[60vh]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-hairline-strong font-mono text-[11px] uppercase tracking-widest text-ink/50">
              <th className="w-12 py-2 pr-3">st</th>
              <th className="w-10 py-2 pr-3">d</th>
              <th className="w-16 py-2 pr-3">ms</th>
              <th className="w-16 py-2 pr-3">words</th>
              <th className="py-2">url</th>
            </tr>
          </thead>
          <tbody>
            {scan.pages.map((page) => (
              <tr key={page.url} className="border-b border-hairline">
                <td className="py-2 pr-3 font-mono text-data text-ink/60">{page.status}</td>
                <td className="py-2 pr-3 font-mono text-data text-ink/40">{page.depth}</td>
                <td className="py-2 pr-3 font-mono text-data text-ink/60">{page.ms}</td>
                <td className="py-2 pr-3 font-mono text-data text-ink/60">{page.wordCount}</td>
                <td className="py-2 font-mono text-[11px] text-ink/70">
                  <span className="break-all">{page.url}</span>
                  {page.title ? (
                    <span className="block text-[10px] text-ink/40">{page.title}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      <div className="mt-6 grid gap-4 font-mono text-data sm:grid-cols-3">
        <div className="border border-hairline p-3">
          <p className="text-[10px] uppercase tracking-widest text-ink/45">robots.txt</p>
          <p className="mt-1">
            {scan.robotsStatus === 200 ? "found (200)" : `missing (${scan.robotsStatus || "no response"})`}
          </p>
        </div>
        <div className="border border-hairline p-3">
          <p className="text-[10px] uppercase tracking-widest text-ink/45">sitemap urls</p>
          <p className="mt-1">{scan.sitemapUrls.length}</p>
        </div>
        <div className="border border-hairline p-3">
          <p className="text-[10px] uppercase tracking-widest text-ink/45">fetch errors</p>
          <p className="mt-1">{scan.errors.length}</p>
        </div>
      </div>

      {scan.errors.length > 0 && (
        <ul className="mt-4 font-mono text-[11px] text-vermillion">
          {scan.errors.map((e, i) => (
            <li key={i} className="py-0.5 break-all">
              {e.url} — {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReportView({ scan, shared = false }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <ScoreHeader scan={scan} className="flex-1" />
        <ShareMenu scanId={scan.id} host={new URL(scan.url).host} />
      </div>

      <DiffStrip diff={scan.diff} />

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList aria-label="Report sections" className="no-print">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="findings">Findings &amp; fixes</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-10 pt-2 lg:grid-cols-2">
            <div className="flex flex-col gap-10">
              <CategoryRail score={scan.score} />
              <LabPanel psi={scan.psi} />
            </div>
            <div className="flex flex-col gap-10">
              <TopCosts findings={scan.findings} />
              <StackPanel findings={scan.findings} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="findings">
          <div className="pt-2">
            <FindingsTable findings={scan.findings} />
          </div>
        </TabsContent>

        <TabsContent value="pages">
          <div className="pt-2">
            <PagesTab scan={scan} />
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-12 font-mono text-[10px] uppercase tracking-widest text-ink/35">
        {shared ? (
          <>public report · generated {new Date(scan.createdAt).toLocaleString()} · run your own at critique.app</>
        ) : (
          <>scanned {new Date(scan.createdAt).toLocaleString()} · one anonymous scan · sign-in history arrives in phase 5</>
        )}
      </p>
    </div>
  );
}
