"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-3), { id, ...t }]);
  }, []);

  const close = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={toast}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map(({ id, title, description }) => (
          <ToastPrimitive.Root
            key={id}
            onOpenChange={(open) => {
              if (!open) close(id);
            }}
            className={cn(
              "z-50 w-[min(24rem,calc(100vw-2rem))] rounded-sm border border-hairline-strong bg-paper px-4 py-3 data-[state=open]:animate-[toast-in_160ms_var(--ease)] data-[state=closed]:animate-[toast-hide_120ms_var(--ease)] data-[swipe=end]:animate-[toast-swipe-out_120ms_var(--ease)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
            )}
          >
            <ToastPrimitive.Title className="text-sm font-medium tracking-tight">
              {title}
            </ToastPrimitive.Title>
            {description ? (
              <ToastPrimitive.Description className="mt-0.5 text-[13px] leading-relaxed text-ink/60">
                {description}
              </ToastPrimitive.Description>
            ) : null}
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
