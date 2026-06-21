'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Lock, UserPlus, LogIn, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import dynamic from 'next/dynamic'

const Strands = dynamic(() => import('./strands'), { ssr: false })

type AuthTab = 'login' | 'register'

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as Record<string, string>).error || `API error ${res.status}`)
  }
  return (await res.json()) as T
}

export function AuthScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setUser = useAppStore((s) => s.setUser)

  const resetForm = () => {
    setName('')
    setPin('')
    setError('')
    setLoading(false)
  }

  const handleLogin = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const user = await apiFetch<{ id: string; name: string; role: string }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      setUser(user)
      toast.success(`Selamat datang, ${user.name}!`)
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('pending')) {
        setError('Akun belum disetujui admin. Silakan tunggu.')
      } else if (msg.includes('rejected')) {
        setError('Permintaan akun ditolak. Hubungi admin.')
      } else if (msg.includes('tidak ditemukan') || msg.includes('not found')) {
        setError('Akun tidak ditemukan. Silakan daftar terlebih dahulu.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await apiFetch('/api/auth/request-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      toast.success('Permintaan akun terkirim! Tunggu admin menyetujui.')
      resetForm()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const user = await apiFetch<{ id: string; name: string; role: string }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Admin', pin }),
      })
      setUser(user)
      toast.success('Selamat datang, Admin!')
      setShowAdminDialog(false)
    } catch (err) {
      setError('PIN salah!')
    } finally {
      setLoading(false)
    }
  }

  const handleTabSwitch = (tab: AuthTab) => {
    setActiveTab(tab)
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'login') {
      handleLogin()
    } else {
      handleRegister()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Strands Background */}
      <div className="fixed inset-0 z-0">
        <Strands
          colors={['#4f46e5', '#06b6d4', '#8b5cf6', '#f97316']}
          count={4}
          speed={0.4}
          amplitude={1.2}
          waviness={1}
          thickness={0.8}
          glow={2.8}
          taper={2.5}
          spread={1.2}
          intensity={0.5}
          saturation={1.5}
          opacity={0.85}
          scale={1.8}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-[#0a0a1a]/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & App Name */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#4f46e5] mb-4 shadow-lg shadow-indigo-500/30">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TabunganKu</h1>
          <p className="text-sm text-white/60 mt-1">Kelola keuanganmu dengan mudah</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl rounded-xl border-0 bg-white/10 backdrop-blur-xl">
          <CardHeader className="pb-0 pt-6 px-6">
            {/* Tab Switcher */}
            <div className="flex rounded-lg bg-white/10 p-1 gap-1">
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'login'
                    ? 'bg-white/90 text-[#4f46e5] shadow-sm'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Masuk
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('register')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'register'
                    ? 'bg-white/90 text-[#4f46e5] shadow-sm'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Daftar Akun
              </button>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="auth-name" className="text-sm font-medium text-white/80">
                  Nama
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="auth-name"
                    placeholder="Masukkan nama kamu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#4f46e5]"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-[#fca5a5] bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium shadow-lg shadow-indigo-500/30"
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {activeTab === 'login' ? 'Memproses...' : 'Mengirim...'}
                  </span>
                ) : activeTab === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Masuk
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Kirim Permintaan Akun
                  </>
                )}
              </Button>
            </form>

            {/* Admin Login Link */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowAdminDialog(true)
                  setPin('')
                  setError('')
                }}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors mx-auto"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Masuk sebagai Admin
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Login Dialog */}
        {showAdminDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAdminDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-sm shadow-2xl border-0 rounded-xl bg-white/10 backdrop-blur-xl">
                <CardHeader className="pb-2 pt-6 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#4f46e5]/30 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-[#a5b4fc]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Admin Login</h3>
                      <p className="text-xs text-white/50">Masuk sebagai administrator</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAdminLogin()
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label htmlFor="admin-name" className="text-sm font-medium text-white/80">
                        Nama
                      </label>
                      <Input
                        id="admin-name"
                        value="Admin"
                        disabled
                        className="h-11 bg-white/10 border-white/20 text-white/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="admin-pin" className="text-sm font-medium text-white/80">
                        PIN
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="admin-pin"
                          type="password"
                          placeholder="Masukkan 4 digit PIN"
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#4f46e5]"
                          maxLength={4}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-[#fca5a5] bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="flex gap-3 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-11 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={() => setShowAdminDialog(false)}
                        disabled={loading}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-11 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium shadow-lg shadow-indigo-500/30"
                        disabled={loading || pin.length !== 4}
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Masuk Admin
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}