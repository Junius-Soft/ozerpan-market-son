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
      const system_user = document.cookie
        .split("; ")
        .find((row) => row.startsWith("system_user="));
      const isAuthed = system_user === "system_user=yes";
      setIsAuthenticated(isAuthed);

      if (!isAuthed) {
        localStorage.removeItem("isAuthenticated");
      } else {
        localStorage.setItem("isAuthenticated", "true");
      }

      setIsInitialized(true);
    };

    // İlk yüklemede ve cookie değişimlerinde kontrol et
    checkAuth();

    // Cookie değişikliklerini kontrol etmek için interval
    const cookieCheckInterval = setInterval(checkAuth, 1000);

    // Storage değişikliklerini dinle
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

    // Retrieve and navigate to the intended path
    const intendedPath = sessionStorage.getItem("intendedPath");
    if (intendedPath) {
      sessionStorage.removeItem("intendedPath");
      window.location.href = intendedPath;
    }
  };

  const handleLogout = () => {
    // Token ve localStorage temizle
    localStorage.removeItem("isAuthenticated");

    // State'i güncelle ve modal'ı sıfırla
    setIsAuthenticated(false);
    setShowLoginModal(false);
    setIsInitialized(true);

    // Ana sayfaya yönlendir
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
