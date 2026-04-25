"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Clock, ShieldAlert, LogOut, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/about", "/contact"];

// Admin-only paths
const ADMIN_PATHS = ["/admin"];

function PendingApprovalScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 shadow-xl shadow-amber-100/50 dark:shadow-amber-900/10">
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" />
          
          <div className="p-8 sm:p-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 dark:bg-amber-500 flex items-center justify-center">
                  <ShieldAlert className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-amber-900 dark:text-amber-100 mb-3">
              Hesabınız Onay Bekliyor
            </h2>

            {/* Description */}
            <p className="text-center text-amber-700/80 dark:text-amber-300/70 mb-6 leading-relaxed">
              Kaydınız başarıyla alınmıştır. Sistemi kullanabilmeniz için yönetici onayı gerekmektedir.
              Lütfen sistem yöneticisi ile iletişime geçiniz.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-amber-200/50 dark:border-amber-800/20">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/60 font-medium">E-posta</p>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">info@ozerpan.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-amber-200/50 dark:border-amber-800/20">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/60 font-medium">Telefon</p>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">+90 (XXX) XXX XX XX</p>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Onay bekleniyor...
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, isAdmin, isApproved, openLoginModal, handleLogout } = useAuth();
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

  // Onaylanmamış kullanıcılar için bekleme ekranı göster
  // Public sayfalar ve admin kullanıcılar hariç
  if (isAuthenticated && !isApproved && !isPublicPath && !isAdmin) {
    return <PendingApprovalScreen onLogout={handleLogout} />;
  }

  return <>{children}</>;
}
