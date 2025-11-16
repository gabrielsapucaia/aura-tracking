"use client";

import { X } from "lucide-react";
import { useToastState } from "./use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToastState();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-xl ${
            toast.variant === "destructive" ? "border-danger/30 bg-danger/10 text-danger" : "border-gray-200 bg-white text-gray-900"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
              {toast.description ? <p className="text-sm text-gray-600">{toast.description}</p> : null}
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              onClick={() => dismiss(toast.id)}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
