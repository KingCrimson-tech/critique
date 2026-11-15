"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Form,
  FormField,
  FormLabel,
  FormControl,
  Button,
  Label,
} from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export function LoginDialog({ open, onOpenChange, redirect = "/sites" }) {
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
        callbackURL: redirect,
      });
      if (result.error) setError(result.error.message ?? "Could not send the link.");
      else setSent(true);
    } catch {
      setError("Could not send the link. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Sign in</DialogTitle>
        <DialogDescription>
          One anonymous scan is free with no account. Signing in keeps your sites, history, and
          claims any scan you already ran on this browser.
        </DialogDescription>

        {sent ? (
          <div className="mt-4 border border-hairline p-4">
            <p className="text-[14px] font-medium tracking-tight">Link sent.</p>
            <p className="mt-1 font-mono text-[12px] leading-relaxed text-ink/60">
              No email service runs in this build — the magic link is printed in the server
              console. Open it in this browser to sign in.
            </p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit} className="mt-4">
            <FormField name="email">
              <FormLabel>Email</FormLabel>
              <FormControl
                asChild
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              >
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="h-10 w-full rounded-sm border border-hairline-strong bg-transparent px-3 font-mono text-[14px] focus:border-ink focus:outline-none"
                />
              </FormControl>
            </FormField>
            {error && <p className="font-mono text-[11px] text-vermillion">{error}</p>}
            <Button type="submit" variant="accent" className="mt-2 w-full" disabled={sending}>
              {sending ? "Sending…" : "Send magic link"}
            </Button>
            {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => authClient.signIn.social({ provider: "google" })}
              >
                Continue with Google
              </Button>
            )}
          </Form>
        )}
        <Label className="mt-3 block text-center normal-case tracking-normal">
          Free · no tiers · no gate
        </Label>
      </DialogContent>
    </Dialog>
  );
}
