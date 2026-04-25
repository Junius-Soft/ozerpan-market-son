"use client";

import Link from "next/link";
import { ShoppingCart, LogIn, LogOut, User, Shield, DollarSign, Users } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "./login-modal";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const {
    isAuthenticated,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    handleLoginSuccess,
    handleLogout,
    profile,
    isAdmin,
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
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={() => router.push("/offers")}
                    variant="outline"
                    className="inline-flex items-center px-4 py-2 gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">Teklifler</span>
                  </Button>

                  {isAdmin && (
                    <Button
                      onClick={() => router.push("/admin/prices")}
                      variant="outline"
                      className="inline-flex items-center px-4 py-2 gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span className="hidden sm:inline">Fiyat Yönetimi</span>
                    </Button>
                  )}

                  {isAdmin && (
                    <Button
                      onClick={() => router.push("/admin/users")}
                      variant="outline"
                      className="inline-flex items-center px-4 py-2 gap-2 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Kullanıcılar</span>
                    </Button>
                  )}

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="inline-flex items-center gap-2 px-3"
                      >
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          {isAdmin ? (
                            <Shield className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="hidden sm:inline text-sm max-w-[120px] truncate">
                          {profile?.full_name || profile?.email || "Kullanıcı"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {profile?.full_name || "Kullanıcı"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {profile?.email}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full w-fit ${
                              isAdmin
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {isAdmin ? (
                              <>
                                <Shield className="h-3 w-3" /> Yönetici
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3" /> Müşteri
                              </>
                            )}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {profile?.company && (
                        <DropdownMenuItem disabled>
                          <span className="text-xs text-muted-foreground">
                            Firma: {profile.company}
                          </span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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