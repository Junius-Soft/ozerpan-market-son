"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// FE Tarafında geçerli olacak sabit kullanıcı bilgileri
const adminUser = {
  email: "test@market.com", // İstediğiniz mail
  password: "Kayseri38",          // İstediğiniz şifre
};

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Yapay bir gecikme ekleyerek (opsiyonel) işlemi daha doğal hissettirebiliriz
    setTimeout(() => {
      try {
        // Şifre ve E-posta kontrolü
        if (email === adminUser.email && password === adminUser.password) {
          
          // Önce mevcut cookie'yi temizle (eğer varsa)
          document.cookie = "system_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
          
          // useAuth hook'unun çalışabilmesi için cookie set ediyoruz
          // (Mevcut yapınız cookie kontrolü yaptığı için bu gerekli)
          // Domain ve path belirtmeden set ediyoruz ki tüm sayfalarda geçerli olsun
          const cookieString = "system_user=yes; path=/; max-age=86400; SameSite=Lax";
          document.cookie = cookieString;
          
          // Cookie'nin doğru set edildiğini kontrol et
          const checkCookie = () => {
            const cookie = document.cookie
              .split("; ")
              .find((row) => row.startsWith("system_user="));
            if (cookie?.split("=")[1] !== "yes") {
              console.warn("Cookie set edilemedi, tekrar deniyor...");
              // Bir kez daha dene
              document.cookie = cookieString;
            }
          };
          setTimeout(checkCookie, 100);

          toast.success("Giriş başarılı!", {
            position: "top-center",
            autoClose: 2000,
            closeButton: false,
          });

          onSuccess();
          onClose();

          const intendedPath = sessionStorage.getItem("intendedPath");
          if (intendedPath) {
            sessionStorage.removeItem("intendedPath");
            router.push(intendedPath);
          }
        } else {
          setError("Hatalı e-posta veya şifre.");
        }
      } catch {
        setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms bekleme
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Yönetici Girişi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              E-posta
            </label>
            <Input
              id="email"
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Şifre
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Şifreniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}