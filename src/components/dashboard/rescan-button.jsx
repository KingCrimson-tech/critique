"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, useToast } from "@/components/ui";

export function RescanButton({ siteId, origin, size = "sm" }) {
  const toast = useToast();
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function rescan() {
    setRunning(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/rescan`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Re-scan failed.", description: json.error });
        return;
      }
      router.push(`/scan/${json.id}`);
    } catch {
      toast({ title: "Re-scan failed.", description: "The engine did not answer." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button variant="outline" size={size} onClick={rescan} disabled={running}>
      {running ? `Scanning ${origin}…` : "Re-scan"}
    </Button>
  );
}
