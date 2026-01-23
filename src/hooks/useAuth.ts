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
      const allCookies = document.cookie.split("; ");
      const system_user = allCookies.find((row) => row.startsWith("system_user="));
      
      // Cookie değerini al (eğer varsa)
      let cookieValue = null;
      if (system_user) {
        const parts = system_user.split("=");
        if (parts.length >= 2) {
          cookieValue = parts.slice(1).join("="); // "=" karakteri değerde olabilir
        }
      }
      
      const isAuthed = cookieValue === "yes";
      
      // Eğer cookie "no" ise, localStorage'dan kontrol et (fallback)
      if (cookieValue === "no" && localStorage.getItem("isAuthenticated") === "true") {
        // LocalStorage'da authenticated var ama cookie no ise, cookie'yi düzelt
        console.warn("Cookie 'no' olarak ayarlanmış ama localStorage authenticated. Cookie düzeltiliyor...");
        document.cookie = "system_user=yes; path=/; max-age=86400; SameSite=Lax";
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(isAuthed);
      }

      if (!isAuthed && cookieValue !== "no") {
        localStorage.removeItem("isAuthenticated");
      } else if (isAuthed) {
        localStorage.setItem("isAuthenticated", "true");
      }

      setIsInitialized(true);
    };

    // İlk yüklemede kontrol et
    checkAuth();

    // Cookie değişikliklerini kontrol etmek için interval
    const cookieCheckInterval = setInterval(() => {
      checkAuth();
      
      // Cookie watchdog: Eğer localStorage'da authenticated var ama cookie "no" ise, düzelt
      const isLocalStorageAuth = localStorage.getItem("isAuthenticated") === "true";
      if (isLocalStorageAuth) {
        const allCookies = document.cookie.split("; ");
        const system_user = allCookies.find((row) => row.startsWith("system_user="));
        if (system_user) {
          const parts = system_user.split("=");
          if (parts.length >= 2) {
            const cookieValue = parts.slice(1).join("=");
            if (cookieValue === "no") {
              // Cookie "no" olarak değiştirilmiş, tekrar "yes" yap
              console.warn("Cookie 'no' olarak değiştirilmiş, düzeltiliyor...");
              document.cookie = "system_user=yes; path=/; max-age=86400; SameSite=Lax";
            }
          }
        }
      }
    }, 1000);

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
    // Cookie'yi kesinlikle set et
    document.cookie = "system_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    document.cookie = "system_user=yes; path=/; max-age=86400; SameSite=Lax";
    
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