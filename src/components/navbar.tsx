"use client";

import Link from "next/link";
import { ShoppingCart, LogIn } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "./login-modal";

export function Navbar() {
  const {
    isAuthenticated,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    handleLoginSuccess,
    handleLogout,
  } = useAuth();

  return (
    <>
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="relative w-[60px] h-[60px]">
                  <Image
                    src="/logo.jpg"
                    alt="Ozerpan Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Ana Sayfa
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Ürünler
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/offers"
                    className="mr-4 inline-flex items-center px-4 py-2 border border-green-200 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 hover:text-green-700 focus:outline-none gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Teklifler
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 hover:text-red-700 focus:outline-none gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Çıkış
                  </button>
                </>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="inline-flex items-center px-4 py-2 border border-green-200 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 hover:text-green-700 focus:outline-none gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Giriş Yap
                </button>
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
