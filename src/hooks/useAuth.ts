"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Token kontrolü
    const checkAuth = () => {
      // LoginModal'da set ettiğimiz cookie'yi kontrol ediyoruz
      const system_user = document.cookie
        .split("; ")
        .find((row) => row.startsWith("system_user="));
      
      const isAuthed = system_user?.split("=")[1] === "yes";
      setIsAuthenticated(isAuthed);

      if (!isAuthed) {
        localStorage.removeItem("isAuthenticated");
      } else {
        localStorage.setItem("isAuthenticated", "true");
      }

      setIsInitialized(true);
    };

    // İlk yüklemede kontrol et
    checkAuth();

    // Cookie değişikliklerini kontrol etmek için interval
    const cookieCheckInterval = setInterval(checkAuth, 1000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "isAuthenticated") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(cookieCheckInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
    setShowLoginModal(false);

    const intendedPath = sessionStorage.getItem("intendedPath");
    if (intendedPath) {
      sessionStorage.removeItem("intendedPath");
      window.location.href = intendedPath;
    }
  };

  const handleLogout = () => {
    // Cookie'yi manuel olarak sil (Tarihi geçmişe alarak)
    document.cookie = "system_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    
    // LocalStorage temizle
    localStorage.removeItem("isAuthenticated");

    setIsAuthenticated(false);
    setShowLoginModal(false);
    setIsInitialized(true);

    router.push("/");
  };

  return {
    isAuthenticated,
    isInitialized,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    handleLoginSuccess,
    handleLogout,
  };
}