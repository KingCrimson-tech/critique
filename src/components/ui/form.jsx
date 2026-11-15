"use client";

import * as FormPrimitive from "@radix-ui/react-form";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/cn";

/* ---------------- Form ---------------- */

export const Form = FormPrimitive.Root;

export function FormField({ name, className, ...props }) {
  return (
    <FormPrimitive.Field name={name} className={cn("flex flex-col gap-2", className)} {...props} />
  );
}

export const FormLabel = FormPrimitive.Label;
export const FormControl = FormPrimitive.Control;

export function FormMessage({ match, className, ...props }) {
  return (
    <FormPrimitive.Message
      match={match}
      className={cn("font-mono text-[11px] text-vermillion", className)}
      {...props}
    />
  );
}

export function FormSubmit({ className, ...props }) {
  return <FormPrimitive.Submit className={className} {...props} />;
}

/* ------------ AlertDialog (destructive only) ------------ */

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export function AlertDialogContent({ className, children, ...props }) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/50 data-[state=open]:animate-[overlay-in_120ms_var(--ease)] data-[state=closed]:animate-[overlay-out_120ms_var(--ease)]" />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-hairline-strong bg-paper p-6 data-[state=open]:animate-[content-in_160ms_var(--ease)] data-[state=closed]:animate-[content-out_120ms_var(--ease)]",
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

export const AlertDialogTitle = ({ className, ...props }) => (
  <AlertDialogPrimitive.Title className={cn("font-display text-headline", className)} {...props} />
);

export const AlertDialogDescription = ({ className, ...props }) => (
  <AlertDialogPrimitive.Description className={cn("mt-1 text-sm text-ink/60", className)} {...props} />
);

export const AlertDialogCancel = ({ className, ...props }) => (
  <AlertDialogPrimitive.Cancel
    className={cn(
      "h-10 border border-hairline-strong px-4 text-sm hover:border-ink hover:bg-ink hover:text-paper",
      className,
    )}
    {...props}
  />
);

export const AlertDialogAction = ({ className, ...props }) => (
  <AlertDialogPrimitive.Action
    className={cn(
      "h-10 border border-vermillion bg-vermillion px-4 text-sm text-paper hover:bg-transparent hover:text-vermillion",
      className,
    )}
    {...props}
  />
);
