import { redirect } from "next/navigation";
import { getViewerFromHeaders } from "@/lib/scans";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const { sessionUser } = await getViewerFromHeaders();
  if (sessionUser) redirect("/sites");
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-display tracking-tight">Sign in</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/70">
        One anonymous scan is free with no account. Signing in keeps your sites and history
        — and claims any scan you already ran on this browser.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
