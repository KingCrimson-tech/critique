import { cn } from "@/lib/cn";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-sm border border-hairline-strong bg-transparent px-3 font-mono text-[15px] text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
