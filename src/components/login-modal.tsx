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
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, UserPlus, LogIn, ArrowLeft, CheckCircle2 } from "lucide-react";

type AuthMode = "login" | "register";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { signIn, signUp } = useAuth();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhone("");
    setCompany("");
    setError(null);
    setShowPassword(false);
    setRegistrationSuccess(false);
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setRegistrationSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    setMode("login");
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.error) {
        setError(result.error);
      } else {
        toast.success("Giriş başarılı!", {
          position: "top-center",
          autoClose: 2000,
          closeButton: false,
        });
        resetForm();
        onSuccess();
        onClose();
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasyonlar
    if (!fullName.trim()) {
      setError("Ad Soyad alanı zorunludur.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(
        email,
        password,
        fullName.trim(),
        phone.trim(),
        company.trim()
      );

      if (result.error) {
        setError(result.error);
      } else {
        setRegistrationSuccess(true);
        toast.success("Kayıt başarılı!", {
          position: "top-center",
          autoClose: 3000,
          closeButton: false,
        });
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Kayıt başarılı ekranı
  if (registrationSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-center">
              Kayıt Başarılı!
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Hesabınız oluşturuldu. E-posta adresinize bir doğrulama bağlantısı
              gönderildi. Lütfen e-postanızı kontrol edin ve hesabınızı
              doğrulayın.
            </p>
            <div className="flex flex-col w-full gap-2 pt-2">
              <Button
                onClick={() => {
                  setRegistrationSuccess(false);
                  setMode("login");
                  resetForm();
                }}
                className="w-full"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Giriş Yap
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                Kapat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {mode === "login" ? (
              <span className="flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5" />
                Giriş Yap
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="h-5 w-5" />
                Hesap Oluştur
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <p className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </p>
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium mb-1"
              >
                E-posta
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium mb-1"
              >
                Şifre
              </label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifreniz"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Giriş Yapılıyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Giriş Yap
                </span>
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  veya
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleModeSwitch("register")}
              disabled={loading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Yeni Hesap Oluştur
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label
                htmlFor="register-fullname"
                className="block text-sm font-medium mb-1"
              >
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <Input
                id="register-fullname"
                type="text"
                placeholder="Adınız Soyadınız"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>
            <div>
              <label
                htmlFor="register-email"
                className="block text-sm font-medium mb-1"
              >
                E-posta <span className="text-red-500">*</span>
              </label>
              <Input
                id="register-email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="register-phone"
                  className="block text-sm font-medium mb-1"
                >
                  Telefon
                </label>
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>
              <div>
                <label
                  htmlFor="register-company"
                  className="block text-sm font-medium mb-1"
                >
                  Firma
                </label>
                <Input
                  id="register-company"
                  type="text"
                  placeholder="Firma adı"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={loading}
                  autoComplete="organization"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="register-password"
                className="block text-sm font-medium mb-1"
              >
                Şifre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-sm font-medium mb-1"
              >
                Şifre Tekrar <span className="text-red-500">*</span>
              </label>
              <Input
                id="register-confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Şifrenizi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kayıt Yapılıyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Hesap Oluştur
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => handleModeSwitch("login")}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zaten hesabım var, giriş yap
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}