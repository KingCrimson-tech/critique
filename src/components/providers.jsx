"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }) {
  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={100}>
      <ToastProvider>{children}</ToastProvider>
    </TooltipProvider>
  );
}
