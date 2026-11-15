"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";

const SEV_STYLE = {
  critical: "text-vermillion",
  high: "text-amber",
  medium: "text-ink",
  low: "text-ink/60",
  info: "text-ink/40",
};
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export default function DebugPage() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(null);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("url");
    if (initial) {
      setUrl(initial);
      runScan(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scanning) return;
    const timer = setInterval(() => setElapsed(Date.now() - startedRef.current), 100);
    return () => clearInterval(timer);
  }, [scanning]);

  async function runScan(value) {
    const target = (value ?? url).trim();
    if (!target) return;
    setScanning(true);
    setResult(null);
    setError(null);
    startedRef.current = Date.now();
    setElapsed(0);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? `HTTP ${res.status}`);
      else setResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  }

  const findings = result?.findings ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
        Debug — raw scan output
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runScan();
        }}
        className="mt-4 flex max-w-2xl flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="url" className="sr-only">
          Site URL
        </label>
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          spellCheck={false}
          disabled={scanning}
        />
        <Button type="submit" variant="accent" disabled={scanning} className="sm:w-40">
          {scanning ? `Scanning… ${(elapsed / 1000).toFixed(1)}s` : "Scan"}
        </Button>
      </form>

      {error && (
        <p className="mt-6 border-l-2 border-vermillion pl-3 font-mono text-sm text-vermillion">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8">
          <div className="flex flex-wrap gap-x-8 gap-y-2 border-y border-hairline py-3 font-mono text-data">
            <span>
              <span className="text-ink/50">url </span>
              {result.url}
            </span>
            <span>
              <span className="text-ink/50">elapsed </span>
              {(result.stats.elapsedMs / 1000).toFixed(1)}s
            </span>
            <span>
              <span className="text-ink/50">pages </span>
              {result.pages.length}
            </span>
            <span>
              <span className="text-ink/50">failed </span>
              {result.errors.length}
            </span>
            {Object.entries(result.counts).map(([sev, n]) =>
              n ? (
                <span key={sev} className={SEV_STYLE[sev]}>
                  {sev} {n}
                </span>
              ) : null,
            )}
          </div>

          <table className="mt-6 w-full text-left">
            <thead>
              <tr className="border-b border-hairline-strong font-mono text-[11px] uppercase tracking-widest text-ink/50">
                <th className="w-20 py-2 pr-3">sev</th>
                <th className="w-24 py-2 pr-3">cat</th>
                <th className="py-2 pr-3">finding</th>
                <th className="w-56 py-2">page</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <tr key={f.id} className="border-b border-hairline align-top">
                  <td className={`py-3 pr-3 font-mono text-data ${SEV_STYLE[f.severity]}`}>
                    {f.severity}
                  </td>
                  <td className="py-3 pr-3 font-mono text-data text-ink/50">{f.category}</td>
                  <td className="py-3 pr-3">
                    <p className="text-[14px] font-medium tracking-tight">{f.title}</p>
                    <p className="mt-0.5 max-w-3xl text-[13px] leading-relaxed text-ink/65">
                      {f.message}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-ink/35">{f.id}</p>
                  </td>
                  <td className="py-3 font-mono text-[10px] break-all text-ink/45">
                    {f.page ?? "sitewide"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <details className="mt-8 border border-hairline p-4">
            <summary className="cursor-pointer font-mono text-data text-ink/60">
              Pages crawled ({result.pages.length})
            </summary>
            <ul className="mt-3 font-mono text-[11px] text-ink/60">
              {result.pages.map((p) => (
                <li key={p.url} className="flex gap-4 py-1">
                  <span className="w-10 text-ink/35">{p.status}</span>
                  <span className="w-14 text-ink/35">d{p.depth}</span>
                  <span className="w-16 text-ink/35">{p.wordCount}w</span>
                  <span className="break-all">{p.url}</span>
                </li>
              ))}
            </ul>
          </details>

          {result.errors.length > 0 && (
            <details className="mt-3 border border-hairline p-4">
              <summary className="cursor-pointer font-mono text-data text-ink/60">
                Fetch errors ({result.errors.length})
              </summary>
              <ul className="mt-3 font-mono text-[11px] text-vermillion">
                {result.errors.map((e, i) => (
                  <li key={i} className="py-1 break-all">
                    {e.url} — {e.message}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <details className="mt-3 border border-hairline p-4">
            <summary className="cursor-pointer font-mono text-data text-ink/60">
              Raw JSON
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto font-mono text-[11px] leading-relaxed text-ink/70">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
