"use client";

import { FrappeProvider } from "frappe-react-sdk";

interface ClientFrappeProviderProps {
  children: React.ReactNode;
  url: string;
}

export function ClientFrappeProvider({
  children,
  url,
}: ClientFrappeProviderProps) {
  // In development, use the rewrite URL to avoid CORS issues
  const frappeUrl =
    process.env.NODE_ENV === "development"
      ? `${
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000"
        }/frappe-api`
      : url;

  return (
    <FrappeProvider
      url={frappeUrl}
      enableSocket={false}
      socketPort={process.env.NODE_ENV === "development" ? undefined : "8001"}
    >
      {children}
    </FrappeProvider>
  );
}
