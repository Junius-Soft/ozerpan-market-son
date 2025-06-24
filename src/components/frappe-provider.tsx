"use client";

import { FrappeProvider } from "frappe-react-sdk";

interface ClientFrappeProviderProps {
  children: React.ReactNode;
}

export function ClientFrappeProvider({ children }: ClientFrappeProviderProps) {
  // Always use the API proxy route to avoid CORS and mixed content issues
  const frappeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/frappe`
      : "/api/frappe";

  return (
    <FrappeProvider url={frappeUrl} enableSocket={false} socketPort={undefined}>
      {children}
    </FrappeProvider>
  );
}
