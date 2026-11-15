"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

// Magic-link sign-in without an email service: the link prints to the server
// console and the page says exactly that. Google appears only when configured.
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const result = await authClient.magicLink.sendMagicLink({
        email: email.trim(),
        callbackURL: "/sites",
      });
      if (result.error) setError(result.error.message ?? "Could not send the link.");
      else setSent(true);
    } catch {
      setError("Could not send the link. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent)
    return (
      <div className="border border-hairline p-4">
        <p className="text-[14px] font-medium tracking-tight">Link sent.</p>
        <p className="mt-1 font-mono text-[12px] leading-relaxed text-ink/60">
          No email service runs in this build — the magic link is printed in the server
          console. Open it in this browser to sign in.
        </p>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-widest text-ink/60">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-12 w-full rounded-sm border border-hairline-strong bg-transparent px-3 font-mono text-[15px] focus:border-ink focus:outline-none"
      />
      {error && <p className="font-mono text-[11px] text-vermillion">{error}</p>}
      <Button type="submit" variant="accent" size="lg" disabled={sending}>
        {sending ? "Sending…" : "Send magic link"}
      </Button>
      {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => authClient.signIn.social({ provider: "google" })}
        >
          Continue with Google
        </Button>
      )}
    </form>
  );
}
