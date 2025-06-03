"use client";

import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Token kontrolü
    const checkAuth = () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="));

      // Token yoksa localStorage'ı temizle
      if (!token) {
        localStorage.removeItem("isAuthenticated");
        setIsAuthenticated(false);
      } else {
        // Token varsa authenticated olarak işaretle
        localStorage.setItem("isAuthenticated", "true");
        setIsAuthenticated(true);
      }

      setIsInitialized(true);
    };

    // İlk yüklemede kontrol et
    checkAuth();

    // Cookie değişikliklerini dinle
    const handleCookieChange = () => {
      checkAuth();
    };

    // Storage değişikliklerini dinle
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "isAuthenticated") {
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleCookieChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      document.removeEventListener("visibilitychange", handleCookieChange);
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

  return {
    isAuthenticated,
    isInitialized,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    handleLoginSuccess,
  };
}
