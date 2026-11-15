export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-baseline sm:justify-between sm:px-6">
        <p className="max-w-md font-mono text-[11px] leading-relaxed text-ink/55">
          Critique — an editorial audit of the web. Scores are penalties, not
          vibes. Every finding ships with a fix.
        </p>
        <nav className="flex gap-6 font-mono text-[11px] uppercase tracking-widest">
          <a href="#checks" className="text-ink/70 transition-colors hover:text-vermillion">
            What we check
          </a>
          <a href="/rubric" className="text-ink/70 transition-colors hover:text-vermillion">
            Rubric
          </a>
        </nav>
      </div>
    </footer>
  );
}
