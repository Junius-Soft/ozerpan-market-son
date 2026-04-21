"use client";

import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const router = useRouter();
  const {
    user,
    profile,
    isAuthenticated,
    isInitialized,
    isAdmin,
    isCustomer,
    isLoading,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  } = useAuthContext();

  const handleLoginSuccess = useCallback(() => {
    closeLoginModal();

    const intendedPath = sessionStorage.getItem("intendedPath");
    if (intendedPath) {
      sessionStorage.removeItem("intendedPath");
      router.push(intendedPath);
    }
  }, [closeLoginModal, router]);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push("/");
  }, [signOut, router]);

  return {
    user,
    profile,
    isAuthenticated,
    isInitialized,
    isAdmin,
    isCustomer,
    isLoading,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    handleLoginSuccess,
    handleLogout,
    signIn,
    signUp,
    refreshProfile,
  };
}