"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/about", "/contact"];

// Admin-only paths
const ADMIN_PATHS = ["/admin"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, isAdmin, openLoginModal } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (!isInitialized) return;

    // Eğer giriş yapılmamış ve public olmayan bir sayfaya erişmeye çalışıyorsa
    if (!isAuthenticated && !isPublicPath) {
      if (pathname !== "/") {
        sessionStorage.setItem("intendedPath", pathname);
      }
      router.replace("/");
      openLoginModal();
      return;
    }

    // Eğer admin sayfasına erişmeye çalışıyor ama admin değilse
    if (isAuthenticated && isAdminPath && !isAdmin) {
      router.replace("/");
      return;
    }
  }, [
    isAuthenticated,
    isInitialized,
    isPublicPath,
    isAdminPath,
    isAdmin,
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

  // Admin sayfalarında admin değilse render etme
  if (isAdminPath && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
