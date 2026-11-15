"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/cn";

export const ToggleGroup = ToggleGroupPrimitive.Root;

export function ToggleGroupItem({ className, ...props }) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        "border border-hairline px-3 py-1 font-mono text-data uppercase tracking-widest text-ink/50 transition-colors duration-[120ms] first:rounded-l-sm last:rounded-r-sm hover:text-ink data-[state=on]:border-ink data-[state=on]:bg-ink data-[state=on]:text-paper",
        className,
      )}
      {...props}
    />
  );
}
