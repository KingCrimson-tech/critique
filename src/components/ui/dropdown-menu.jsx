"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/cn";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-40 rounded-sm border border-hairline-strong bg-paper p-1 data-[state=open]:animate-[content-in_120ms_var(--ease)] data-[state=closed]:animate-[content-out_120ms_var(--ease)]",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-xs px-2.5 py-1.5 text-[13px] outline-none transition-colors duration-[120ms] data-[highlighted]:bg-ink data-[highlighted]:text-paper",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("mx-1 my-1 h-px bg-hairline", className)}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn(
        "px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink/50",
        className,
      )}
      {...props}
    />
  );
}
