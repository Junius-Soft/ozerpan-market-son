"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { UserRole } from "@/types/supabase";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  company: string | null;
  is_approved: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isApproved: boolean;
  isLoading: boolean;
  showLoginModal: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    company?: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Profil bilgilerini getir
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profil yüklenirken hata:", error.message);
        return null;
      }

      return data as UserProfile;
    } catch (err) {
      console.error("Profil getirme hatası:", err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    }
  }, [user, fetchProfile]);

  // İlk yükleme ve oturum değişikliklerini dinle
  useEffect(() => {
    let mounted = true;
    let initDone = false;

    const initAuth = async () => {
      try {
        // Mevcut oturumu kontrol et - getSession() network request yapmaz
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (mounted && currentSession?.user) {
          setUser(currentSession.user);
          setSession(currentSession);

          const profileData = await fetchProfile(currentSession.user.id);
          if (mounted && profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error("Auth başlatma hatası:", error);
      } finally {
        if (mounted) {
          setIsInitialized(true);
          setIsLoading(false);
          initDone = true;
        }
      }
    };

    initAuth();

    // Oturum değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      // initAuth tamamlanmadan gelen INITIAL_SESSION event'ini yoksay
      // (initAuth zaten hallediyor)
      if (event === "INITIAL_SESSION" && !initDone) {
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_OUT") {
        setProfile(null);
        return;
      }

      if (newSession?.user) {
        // TOKEN_REFRESHED event'inde profili tekrar çekmeye gerek yok
        if (event === "TOKEN_REFRESHED") {
          return;
        }

        const profileData = await fetchProfile(newSession.user.id);
        if (mounted && profileData) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Giriş
  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: string | null }> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === "Invalid login credentials") {
            return { error: "Hatalı e-posta veya şifre." };
          }
          if (error.message === "Email not confirmed") {
            return {
              error:
                "E-posta adresiniz henüz doğrulanmadı. Lütfen e-postanızı kontrol edin.",
            };
          }
          return { error: error.message };
        }

        // Hemen user ve session'ı set et - UI anında güncellenir
        if (data.session && data.user) {
          setUser(data.user);
          setSession(data.session);

          // Profili arka planda yükle (await etmiyoruz - login'i yavaşlatmasın)
          fetchProfile(data.user.id).then((profileData) => {
            if (profileData) {
              setProfile(profileData);
            }
          });
        }

        return { error: null };
      } catch (err) {
        console.error("Giriş hatası:", err);
        return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProfile]
  );

  // Kayıt
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      phone?: string,
      company?: string
    ): Promise<{ error: string | null }> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: "customer",
              phone: phone || "",
              company: company || "",
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            return { error: "Bu e-posta adresi zaten kayıtlı." };
          }
          return { error: error.message };
        }

        // Eğer email doğrulama gerekliyse
        if (data.user && !data.session) {
          return {
            error: null,
          };
        }

        return { error: null };
      } catch (err) {
        console.error("Kayıt hatası:", err);
        return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Çıkış
  const signOut = useCallback(async () => {
    // State'i hemen temizle - UI anında güncellenir
    setUser(null);
    setSession(null);
    setProfile(null);
    
    // Supabase'e bildir
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn("Supabase signOut hatası (state zaten temizlendi):", error);
    }
  }, []);

  const openLoginModal = useCallback(() => setShowLoginModal(true), []);
  const closeLoginModal = useCallback(() => setShowLoginModal(false), []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    isAuthenticated: !!user && !!session,
    isInitialized,
    isAdmin: profile?.role === "admin",
    isCustomer: profile?.role === "customer",
    isApproved: profile?.role === "admin" ? true : (profile?.is_approved ?? false),
    isLoading,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
