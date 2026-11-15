"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/cn";

export function Progress({ value, indeterminate = false, className, ...props }) {
  return (
    <ProgressPrimitive.Root
      value={indeterminate ? null : value ?? 0}
      className={cn("relative h-0.5 w-full overflow-hidden bg-hairline", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full bg-vermillion",
          indeterminate
            ? "w-1/4 animate-[progress-indeterminate_1.2s_var(--ease)_infinite]"
            : "w-full transition-transform duration-[160ms]",
        )}
        style={
          indeterminate ? undefined : { transform: `translateX(-${100 - (value ?? 0)}%)` }
        }
      />
    </ProgressPrimitive.Root>
  );
}
