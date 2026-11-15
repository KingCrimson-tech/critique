import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-24 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50">404</p>
      <h1 className="mt-3 font-display text-display tracking-tight">
        Nothing here.
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/70">
        Either this page never existed, or it belonged to someone else and we do not
        confirm other people&apos;s reports. Both look identical on purpose.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block w-fit font-mono text-data text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-vermillion"
      >
        Run an audit instead →
      </Link>
    </div>
  );
}
