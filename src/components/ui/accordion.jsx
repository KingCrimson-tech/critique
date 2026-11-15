"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/cn";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...props }) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b border-hairline", className)}
      {...props}
    />
  );
}

export function AccordionTrigger({ className, children, ...props }) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 py-4 text-left transition-colors duration-[120ms] hover:text-vermillion",
          className,
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden
          className="shrink-0 font-mono text-data text-ink/50 transition-transform duration-[120ms] group-data-[state=open]:rotate-45"
        >
          +
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden data-[state=closed]:animate-[accordion-up_120ms_var(--ease)] data-[state=open]:animate-[accordion-down_160ms_var(--ease)]",
        className,
      )}
      {...props}
    >
      <div className="pb-5">{children}</div>
    </AccordionPrimitive.Content>
  );
}
