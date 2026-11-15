"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/cn";

export function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "font-mono text-[11px] uppercase tracking-widest text-ink/60",
        className,
      )}
      {...props}
    />
  );
}
