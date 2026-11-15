"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/cn";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-sm border border-hairline-strong bg-transparent px-3 text-sm transition-colors duration-[120ms] data-[placeholder]:text-ink/40 hover:border-ink focus:border-ink focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="text-ink/50">
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ className, children, ...props }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={4}
        className={cn(
          "z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] rounded-sm border border-hairline-strong bg-paper p-1 data-[state=open]:animate-[content-in_120ms_var(--ease)] data-[state=closed]:animate-[content-out_120ms_var(--ease)]",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "flex cursor-default select-none items-center rounded-xs px-2.5 py-1.5 text-[13px] outline-none transition-colors duration-[120ms] data-[highlighted]:bg-ink data-[highlighted]:text-paper data-[state=checked]:font-medium",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-auto font-mono text-data">
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M1 5l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export function SelectLabel({ className, ...props }) {
  return (
    <SelectPrimitive.Label
      className={cn(
        "px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink/50",
        className,
      )}
      {...props}
    />
  );
}
