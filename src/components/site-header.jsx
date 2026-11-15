"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { LoginDialog } from "@/components/login-dialog";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { data: session, isPending } = authClient.useSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const pathname = usePathname();
  const user = session?.user ?? null;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-hairline bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-baseline gap-6">
          <Link
            href="/"
            className="font-display text-[22px] leading-none tracking-tight"
          >
            Critique<span className="text-vermillion">.</span>
          </Link>
          {user && (
            <Link
              href="/sites"
              aria-current={pathname.startsWith("/sites") ? "page" : undefined}
              className={`font-mono text-[11px] uppercase tracking-widest transition-colors ${
                pathname.startsWith("/sites") ? "text-ink" : "text-ink/55 hover:text-ink"
              }`}
            >
              Your sites
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-[11px] uppercase tracking-widest text-ink/55 sm:inline">
            Free · No tiers · No gate
          </span>
          {isPending ? null : user ? (
            <button
              type="button"
              onClick={() => authClient.signOut()}
              className="font-mono text-[11px] uppercase tracking-widest text-ink/60 transition-colors hover:text-vermillion"
              title={user.email}
            >
              Sign out
            </button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>
              Sign in
            </Button>
          )}
        </div>
      </div>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
