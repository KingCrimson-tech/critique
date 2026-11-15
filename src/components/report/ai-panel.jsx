"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Progress,
  useToast,
} from "@/components/ui";

// "Ask the AIs" — three fixed questions about {host} answered by two LLM
// providers, cached 72h. A snapshot of a moving target, labelled as such.
export function AiPanelDialog({ open, onOpenChange, scanId, host }) {
  const toast = useToast();
  const [competitor, setCompetitor] = useState("");
  const [running, setRunning] = useState(false);
  const [probe, setProbe] = useState(null);
  const [notice, setNotice] = useState(null);

  async function run() {
    setRunning(true);
    setNotice(null);
    try {
      const res = await fetch("/api/ai-probe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scanId, competitor: competitor.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 429) setNotice(json.detail ?? json.error);
        else toast({ title: "Probe failed.", description: json.error });
        return;
      }
      setProbe(json);
    } catch {
      toast({ title: "Probe failed.", description: "The probe engine did not answer." });
    } finally {
      setRunning(false);
    }
  }

  const providersUnconfigured = probe?.results?.some((r) =>
    r.answers.some((a) => a.error === "not_configured"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogTitle>Ask the AIs about {host}</DialogTitle>
        <DialogDescription>
          Three fixed questions, two language models, one snapshot. Cached for 72 hours
          per site — this is what the machines say right now, not the truth.
        </DialogDescription>

        {!probe && (
          <div className="mt-4">
            <label
              htmlFor="competitor"
              className="font-mono text-[11px] uppercase tracking-widest text-ink/60"
            >
              Head-to-head opponent (optional)
            </label>
            <Input
              id="competitor"
              className="mt-1"
              placeholder="their biggest rival"
              maxLength={60}
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
            />
            <Button variant="accent" className="mt-4 w-full" onClick={run} disabled={running}>
              {running ? "Asking…" : "Run the probe"}
            </Button>
            {running && <Progress className="mt-4" aria-label="Asking the models" />}
            {notice && (
              <p className="mt-3 border border-hairline p-3 font-mono text-[11px] leading-relaxed text-amber">
                {notice}
              </p>
            )}
          </div>
        )}

        {probe && (
          <div className="mt-4 flex flex-col gap-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/50">
              topic: {probe.topic} ·{" "}
              {probe.cached ? (
                <>cached snapshot from {new Date(probe.createdAt).toLocaleString()}</>
              ) : (
                <>fresh snapshot · {new Date(probe.createdAt).toLocaleString()}</>
              )}
            </p>
            {providersUnconfigured && (
              <p className="border border-hairline p-3 font-mono text-[11px] leading-relaxed text-ink/60">
                Some providers have no API key configured in this environment — their
                slots show what is missing instead of an answer.
              </p>
            )}

            {probe.results.map((result) => (
              <section key={result.promptId} className="border-t border-hairline pt-4">
                <h4 className="font-mono text-[11px] uppercase tracking-widest text-ink/45">
                  {result.label}
                </h4>
                <p className="mt-1 text-[13px] leading-relaxed text-ink/70">
                  {result.question}
                </p>
                <ul className="mt-3 flex flex-col gap-3">
                  {result.answers.map((answer) => (
                    <li key={answer.provider} className="border border-hairline p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
                          {answer.providerLabel}
                        </span>
                        {answer.ok ? (
                          <SentimentTag sentiment={answer.sentiment} mentioned={answer.mentioned} />
                        ) : (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                            {answer.error === "not_configured" ? "no api key" : "no answer"}
                          </span>
                        )}
                      </div>
                      {answer.ok && (
                        <>
                          <p className="mt-2 text-[14px] leading-relaxed">{answer.verdict}</p>
                          {answer.rank !== null && (
                            <p className="mt-1 font-mono text-[11px] text-ink/55">
                              placed #{answer.rank}
                            </p>
                          )}
                          {answer.citedUrls.length > 0 && (
                            <ul className="mt-2 flex flex-col gap-0.5 font-mono text-[11px]">
                              {answer.citedUrls.map((url) => (
                                <li key={url} className="break-all text-ink/55">
                                  ↳ {url}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <Button
              variant="outline"
              onClick={() => {
                setProbe(null);
                setNotice(null);
              }}
            >
              Ask again with a different opponent
            </Button>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
              snapshots are cached 72h · fresh probes are rate-limited · this is a
              sample, not a verdict
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SentimentTag({ sentiment, mentioned }) {
  const label = !mentioned ? "not mentioned" : sentiment;
  const cls =
    sentiment === "positive"
      ? "border-green text-green"
      : sentiment === "negative"
        ? "border-vermillion text-vermillion"
        : "border-ink/40 text-ink/60";
  return (
    <span
      className={`inline-block rounded-xs border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${cls}`}
    >
      {label}
    </span>
  );
}
