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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
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
  const fetchProfile = useCallback(async (userId: string) => {
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
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  // İlk yükleme ve oturum değişikliklerini dinle
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Mevcut oturumu kontrol et
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (mounted && currentSession?.user) {
          setUser(currentSession.user);
          setSession(currentSession);

          const profileData = await fetchProfile(currentSession.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error("Auth başlatma hatası:", error);
      } finally {
        if (mounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Oturum değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const profileData = await fetchProfile(newSession.user.id);
        if (mounted) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }

      if (event === "SIGNED_OUT") {
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

        if (data.user) {
          const profileData = await fetchProfile(data.user.id);
          setProfile(profileData);
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
    console.log("signOut çağrıldı");
    
    // State'i hemen temizle - UI anında güncellenir
    setUser(null);
    setSession(null);
    setProfile(null);
    
    // Supabase'e bildir ama bekleme (timeout ile)
    try {
      const signOutPromise = supabase.auth.signOut({ scope: 'local' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('signOut timeout')), 3000)
      );
      await Promise.race([signOutPromise, timeoutPromise]);
      console.log("Supabase signOut başarılı");
    } catch (error) {
      console.warn("Supabase signOut timeout veya hata (state zaten temizlendi):", error);
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
