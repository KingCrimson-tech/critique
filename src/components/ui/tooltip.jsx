"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({ content, side = "top", children, open }) {
  if (!content) return children;
  return (
    <TooltipPrimitive.Root open={open}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 max-w-64 rounded-sm bg-ink px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-paper data-[state=delayed-open]:animate-[content-in_120ms_var(--ease)]",
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
