"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-24 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50">error</p>
      <h1 className="mt-3 font-display text-display tracking-tight">
        That broke. Not gracefully.
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/70">
        Something failed on our side. Nothing was lost — run the audit again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 w-fit font-mono text-data text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-vermillion"
      >
        Try again →
      </button>
    </div>
  );
}
