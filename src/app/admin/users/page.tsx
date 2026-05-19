"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, Clock, Users, ShieldCheck, Search,
  UserCheck, UserX, Shield, User, Building2, Phone, Mail,
  Trash2, AlertTriangle, UserPlus,
} from "lucide-react";
import { toast } from "react-toastify";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  company: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

type FilterType = "all" | "pending" | "approved";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Kullanıcılar yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    setProcessingIds((prev) => new Set(prev).add(userId));
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, is_approved: approve }),
      });
      if (!response.ok) throw new Error("Failed to update user");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_approved: approve } : u))
      );
      toast.success(approve ? "Kullanıcı onaylandı!" : "Kullanıcı onayı kaldırıldı!", {
        position: "top-center", autoClose: 2000,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("İşlem sırasında hata oluştu");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users?userId=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.full_name || deleteTarget.email}" silindi!`, {
        position: "top-center", autoClose: 2000,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Kullanıcı silinirken hata oluştu");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to invite user");
      toast.success(`Davet maili gönderildi: ${inviteEmail}`, {
        position: "top-center", autoClose: 3000,
      });
      setInviteEmail("");
      setShowInviteDialog(false);
      setTimeout(() => loadUsers(), 1500);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast.error(`Davet gönderilemedi: ${msg}`);
    } finally {
      setIsInviting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (filter === "pending") result = result.filter((u) => !u.is_approved && u.role !== "admin");
    else if (filter === "approved") result = result.filter((u) => u.is_approved || u.role === "admin");
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.full_name?.toLowerCase().includes(q)) ||
          (u.company?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [users, filter, searchQuery]);

  const stats = useMemo(() => ({
    total: users.length,
    pending: users.filter((u) => !u.is_approved && u.role !== "admin").length,
    approved: users.filter((u) => u.is_approved || u.role === "admin").length,
  }), [users]);

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Kullanıcı Davet Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={(open) => { setShowInviteDialog(open); if (!open) setInviteEmail(""); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                Yeni Kullanıcı Davet Et
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                Kullanıcıya e-posta ile davet linki gönderilecek. Davet linki üzerinden sisteme giriş yapabilirler.
              </p>
              <div className="space-y-1">
                <label className="text-sm font-medium">E-posta Adresi</label>
                <Input
                  type="email"
                  placeholder="ornek@firma.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setShowInviteDialog(false); setInviteEmail(""); }} disabled={isInviting}>
                İptal
              </Button>
              <Button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail.trim()}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isInviting ? (
                  <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gönderiliyor...</>
                ) : (
                  <><UserPlus className="h-4 w-4" /> Davet Gönder</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Silme Onay Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Kullanıcıyı Sil
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{deleteTarget?.full_name || deleteTarget?.email}</strong> adlı kullanıcıyı silmek istediğinizden emin misiniz?
              </p>
              <div className="rounded-lg border border-red-100 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
                ⚠️ Bu işlem geri alınamaz. Kullanıcının tüm teklifleri de silinecektir.
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                İptal
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2">
                {isDeleting ? (
                  <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Siliniyor...</>
                ) : (
                  <><Trash2 className="h-4 w-4" /> Evet, Sil</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" /> Kullanıcı Yönetimi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kayıtlı kullanıcıları yönetin ve onaylayın
            </p>
          </div>
          <Button
            onClick={() => setShowInviteDialog(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <UserPlus className="h-4 w-4" />
            Kullanıcı Davet Et
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard icon={<Users className="h-5 w-5" />} label="Toplam Kullanıcı" value={stats.total} color="blue" />
          <StatsCard icon={<Clock className="h-5 w-5" />} label="Onay Bekleyen" value={stats.pending} color="amber" />
          <StatsCard icon={<ShieldCheck className="h-5 w-5" />} label="Onaylanan" value={stats.approved} color="emerald" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İsim, e-posta veya firma ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü ({stats.total})</SelectItem>
              <SelectItem value="pending">Onay Bekleyenler ({stats.pending})</SelectItem>
              <SelectItem value="approved">Onaylananlar ({stats.approved})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Kullanıcı bulunamadı</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {searchQuery ? "Arama kriterlerinize uygun kullanıcı yok" : "Henüz kayıtlı kullanıcı bulunmuyor"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>İletişim</TableHead>
                      <TableHead>Firma</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Kayıt Tarihi</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                              user.role === "admin"
                                ? "bg-amber-100 dark:bg-amber-900/30"
                                : user.is_approved
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : "bg-gray-100 dark:bg-gray-800"
                            }`}>
                              {user.role === "admin" ? (
                                <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              )}
                            </div>
                            <span className="font-medium">{user.full_name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.company ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              {user.company}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                            user.role === "admin"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}>
                            {user.role === "admin" ? (
                              <><Shield className="h-3 w-3" /> Yönetici</>
                            ) : (
                              <><User className="h-3 w-3" /> Müşteri</>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("tr-TR", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          {user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Yönetici
                            </span>
                          ) : user.is_approved ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Onaylı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <Clock className="h-3 w-3" /> Bekliyor
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.role !== "admin" && (
                            <div className="flex items-center justify-end gap-2">
                              {user.is_approved ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproval(user.id, false)}
                                  disabled={processingIds.has(user.id)}
                                  className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                  {processingIds.has(user.id) ? (
                                    <span className="h-3.5 w-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                  ) : (
                                    <UserX className="h-3.5 w-3.5" />
                                  )}
                                  Onayı Kaldır
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproval(user.id, true)}
                                  disabled={processingIds.has(user.id)}
                                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  {processingIds.has(user.id) ? (
                                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <UserCheck className="h-3.5 w-3.5" />
                                  )}
                                  Onayla
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteTarget(user)}
                                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.role === "admin"
                            ? "bg-amber-100 dark:bg-amber-900/30"
                            : user.is_approved
                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}>
                          {user.role === "admin" ? (
                            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      {user.role === "admin" ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                          Yönetici
                        </span>
                      ) : user.is_approved ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Onaylı
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Bekliyor
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {user.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {user.company}
                        </span>
                      )}
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {user.phone}
                        </span>
                      )}
                    </div>
                    {user.role !== "admin" && (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          {user.is_approved ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproval(user.id, false)}
                              disabled={processingIds.has(user.id)}
                              className="w-full gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <UserX className="h-3.5 w-3.5" /> Onayı Kaldır
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleApproval(user.id, true)}
                              disabled={processingIds.has(user.id)}
                              className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <UserCheck className="h-3.5 w-3.5" /> Onayla
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(user)}
                          className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number;
  color: "blue" | "amber" | "emerald";
}) {
  const colors = {
    blue: "from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-800/30 text-blue-700 dark:text-blue-400",
    amber: "from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-400",
    emerald: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400",
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/60 dark:bg-white/5">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs opacity-70">{label}</p>
        </div>
      </div>
    </div>
  );
}
