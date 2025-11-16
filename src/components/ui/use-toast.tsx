"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "default" | "destructive";

type ToastInput = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type Toast = ToastInput & { id: string };

type ToastContextValue = {
  toasts: Toast[];
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ duration = 4000, ...input }: ToastInput) => {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const nextToast: Toast = { id, ...input };
      setToasts((prev) => [...prev, nextToast]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return { toast: ctx.toast };
}

export function useToastState() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToastState must be used within <ToastProvider>");
  }
  return ctx;
}
