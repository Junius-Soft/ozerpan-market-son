"use client";

import * as React from "react";
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastViewport,
  ToastProps,
  ToastAction,
} from "@/components/ui/toast";
import { useCallback, useState } from "react";

type ShowToastOptions = {
  variant?: ToastProps["variant"];
};

const ToastContext = React.createContext<{
  showToast: (
    title: string,
    description: string,
    options?: ShowToastOptions
  ) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [variant, setVariant] = useState<ToastProps["variant"]>("default");

  const showToast = useCallback(
    (title: string, description: string, options?: ShowToastOptions) => {
      setTitle(title);
      setDescription(description);
      setVariant(options?.variant ?? "default");
      setOpen(true);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      <RadixToastProvider swipeDirection="right">
        {children}
        <Toast open={open} onOpenChange={setOpen} variant={variant}>
          <div className="grid gap-1">
            {title && (
              <ToastTitle showIcon={variant === "warning"}>{title}</ToastTitle>
            )}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastAction altText="Anladım" onClick={() => setOpen(false)}>
            Anladım
          </ToastAction>
        </Toast>
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
