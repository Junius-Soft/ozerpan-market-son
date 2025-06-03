"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/about", "/contact"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, openLoginModal } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isInitialized && !isAuthenticated && !isPublicPath) {
      // Store the intended path before redirecting
      if (pathname !== "/") {
        sessionStorage.setItem("intendedPath", pathname);
      }
      router.replace("/");
      openLoginModal();
    }
  }, [
    isAuthenticated,
    isInitialized,
    isPublicPath,
    pathname,
    router,
    openLoginModal,
  ]);

  // Don't render anything until we've initialized auth
  if (!isInitialized) {
    return null;
  }

  // After initialization, if not authenticated and not public path, render nothing
  if (!isAuthenticated && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
