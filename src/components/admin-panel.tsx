'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Shield,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { formatDate } from '@/lib/format'

interface UserRecord {
  id: string
  name: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
  _count?: { transactions: number }
}

interface UsersResponse {
  users: UserRecord[]
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as Record<string, string>).error || `API error ${res.status}`)
  }
  return (await res.json()) as T
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          Disetujui
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          Menunggu
        </Badge>
      )
    case 'rejected':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          Ditolak
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
        Admin
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      User
    </Badge>
  )
}

export function AdminPanel() {
  const user = useAppStore((s) => s.user)
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null)

  const { data, isLoading, refetch } = useQuery<UsersResponse>({
    queryKey: ['admin-users'],
    queryFn: () =>
      apiFetch<UsersResponse>('/api/admin/users', {
        headers: { 'X-User-Id': user?.id || '' },
      }),
    enabled: !!user?.id,
  })

  const allUsers = data?.users || []
  const pendingUsers = allUsers.filter((u) => u.status === 'pending' && u.role !== 'admin')
  const approvedCount = allUsers.filter((u) => u.status === 'approved' && u.role !== 'admin').length

  const approveMutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: { 'X-User-Id': user?.id || '' },
      }),
    onSuccess: () => {
      toast.success('Akun berhasil disetujui!')
      refetch()
    },
    onError: (err) => {
      toast.error((err as Error).message)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/api/admin/users/${userId}/reject`, {
        method: 'PATCH',
        headers: { 'X-User-Id': user?.id || '' },
      }),
    onSuccess: () => {
      toast.success('Akun ditolak.')
      refetch()
    },
    onError: (err) => {
      toast.error((err as Error).message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': user?.id || '' },
      }),
    onSuccess: () => {
      toast.success('Pengguna berhasil dihapus.')
      setDeleteTarget(null)
      refetch()
    },
    onError: (err) => {
      toast.error((err as Error).message)
    },
  })

  const isMutating = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#4f46e5]/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[#4f46e5]" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Kelola pengguna dan permintaan akun</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Total Pengguna</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingUsers.length}</p>
                <p className="text-xs text-muted-foreground">Menunggu Persetujuan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Permintaan Akun Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Tidak ada permintaan akun baru</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {pendingUsers.map((u) => (
                  <motion.div
                    key={u.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{u.name}</p>
                        <StatusBadge status={u.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Diajukan {formatDate(u.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-3 shrink-0">
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-3"
                        onClick={() => approveMutation.mutate(u.id)}
                        disabled={isMutating}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Setujui</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 px-3"
                        onClick={() => rejectMutation.mutate(u.id)}
                        disabled={isMutating}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tolak</span>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* All Users Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-[#4f46e5]" />
            Daftar Pengguna
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : allUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada pengguna</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {allUsers.map((u) => {
                  const isAdmin = u.role === 'admin'
                  const isSelf = u.id === user?.id
                  return (
                    <motion.div
                      key={u.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between p-4 bg-white border border-border/50 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">
                            {u.name}
                            {isAdmin && (
                              <Shield className="w-3.5 h-3.5 text-indigo-500 ml-1 inline" />
                            )}
                          </p>
                          <StatusBadge status={u.status} />
                          <RoleBadge role={u.role} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{u._count?.transactions || 0} transaksi</span>
                          <span>&middot;</span>
                          <span>Bergabung {formatDate(u.createdAt)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0 ml-2"
                        onClick={() => setDeleteTarget(u)}
                        disabled={isAdmin || isSelf || isMutating}
                        title={isAdmin || isSelf ? 'Tidak dapat dihapus' : 'Hapus pengguna'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#e11d48]" />
              Hapus Pengguna
            </DialogTitle>
            <DialogDescription>
              Apakah kamu yakin ingin menghapus pengguna{' '}
              <strong className="text-foreground">{deleteTarget?.name}</strong>? Semua data transaksi
              pengguna ini akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}