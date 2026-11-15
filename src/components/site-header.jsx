import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-[22px] leading-none tracking-tight"
        >
          Critique<span className="text-vermillion">.</span>
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink/55">
          Free · No tiers · No gate
        </span>
      </div>
    </header>
  );
}
