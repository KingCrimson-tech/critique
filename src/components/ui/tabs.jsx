"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn("flex items-stretch gap-6 border-b border-hairline", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "-mb-px border-b border-transparent pb-2.5 font-mono text-data uppercase tracking-widest text-ink/50 transition-colors duration-[120ms] hover:text-ink data-[state=active]:border-vermillion data-[state=active]:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn("pt-5 data-[state=inactive]:hidden", className)}
      {...props}
    />
  );
}
