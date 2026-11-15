"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Button,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export function ShareMenu({ scanId, host }) {
  const toast = useToast();
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recent, setRecent] = useState(null);
  const [picked, setPicked] = useState([]);

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch("/api/scans/recent");
      const json = await res.json();
      setRecent(json.scans ?? []);
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    if (pickerOpen) {
      setPicked([]);
      loadRecent();
    }
  }, [pickerOpen, loadRecent]);

  async function copyShareLink() {
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scanId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Could not create the share link.", description: json.error });
        return;
      }
      await navigator.clipboard.writeText(`${window.location.origin}/s/${json.slug}`);
      toast({
        title: "Share link copied.",
        description: `critique.app/s/${json.slug} — public, no account needed.`,
      });
    } catch {
      toast({ title: "Clipboard refused.", description: "Copy the URL from the address bar instead." });
    }
  }

  function togglePick(id) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    );
  }

  return (
    <div className="no-print">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Share ▾
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void copyShareLink()}>Copy public link</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPickerOpen(true)}>
            Compare with another scan…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.print()}>Print / save as PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogTitle>Compare scans</DialogTitle>
          <DialogDescription>
            Pick up to three other scans from this session. The comparison opens side by side,
            with a winner named per category.
          </DialogDescription>

          <div className="mt-4 max-h-64 overflow-y-auto border border-hairline">
            {recent === null && (
              <p className="p-4 font-mono text-data text-ink/45">Loading…</p>
            )}
            {recent?.length === 0 && (
              <p className="p-4 font-mono text-data text-ink/45">
                No other scans in this session yet. Run a second audit first.
              </p>
            )}
            {recent
              ?.filter((s) => s.id !== scanId)
              .map((scan) => (
                <button
                  key={scan.id}
                  type="button"
                  onClick={() => togglePick(scan.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 border-b border-hairline px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-ink/[0.03]",
                    picked.includes(scan.id) && "bg-ink/[0.05]",
                  )}
                >
                  <span className="truncate font-mono text-data">
                    {new URL(scan.url).host}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                      {scan.hasPsi ? "psi ✓" : "no psi"}
                    </span>
                    <span className="font-display text-[18px]">{scan.overall}</span>
                  </span>
                </button>
              ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-[11px] text-ink/45">{picked.length}/3 picked</span>
            <Button
              variant="accent"
              size="sm"
              disabled={picked.length === 0}
              onClick={() => {
                setPickerOpen(false);
                router.push(`/compare?ids=${[scanId, ...picked].join(",")}`);
              }}
            >
              Compare
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
