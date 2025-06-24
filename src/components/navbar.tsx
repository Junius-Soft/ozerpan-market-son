"use client";

import Link from "next/link";
import { ShoppingCart, LogIn } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "./login-modal";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useRouter } from "next/navigation";
import { useFrappeAuth } from "frappe-react-sdk";
import { useState } from "react";

export function Navbar() {
  const { logout } = useFrappeAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const {
    isAuthenticated,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    handleLoginSuccess,
  } = useAuth();

  const router = useRouter();

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="relative w-[60px] h-[60px]">
                  <Image
                    src="/logo.png"
                    alt="Özerpan Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                >
                  Ana Sayfa
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                >
                  Ürünler
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={() => router.push("/offers")}
                    variant="outline"
                    className="inline-flex items-center px-4 py-2 gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Teklifler
                  </Button>
                  <Button
                    onClick={async () => {
                      setLoggingOut(true);
                      await logout();
                    }}
                    variant="secondary"
                    disabled={loggingOut}
                    className="inline-flex items-center px-4 py-2"
                  >
                    <LogIn className="h-4 w-4" />
                    {loggingOut ? "Çıkış Yapılıyor.." : "Çıkış"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={openLoginModal}
                  className="inline-flex items-center px-4 py-2 gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Giriş Yap
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <LoginModal
        isOpen={showLoginModal}
        onClose={closeLoginModal}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
