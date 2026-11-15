"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";

const VARIANTS = {
  solid:
    "border border-ink bg-ink text-paper hover:bg-transparent hover:text-ink",
  accent:
    "border border-vermillion bg-vermillion text-paper hover:bg-transparent hover:text-vermillion",
  outline:
    "border border-hairline-strong bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-paper",
  ghost: "border border-transparent bg-transparent text-ink hover:text-vermillion",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function Button({
  asChild = false,
  variant = "solid",
  size = "md",
  className,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm font-sans font-medium tracking-tight transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
