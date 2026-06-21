'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  PlusCircle,
  Settings,
  LogOut,
  AlertTriangle,
  Database,
  Info,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Trash2,
  X,
  MoreHorizontal,
  Wallet,
  ShoppingBag,
  UtensilsCrossed,
  Car,
  Gamepad2,
  Receipt,
  Heart,
  GraduationCap,
  Briefcase,
  Laptop,
  Landmark,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

import { useAppStore, type TabType } from '@/lib/store'
import {
  formatCurrency,
  formatDate,
  CATEGORY_COLORS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  getTodayISO,
} from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ── Safe Fetch Helper ────────────────────────────────
async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, init)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as Record<string, string>).error || `API error ${res.status}`)
    }
    return (await res.json()) as T
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Network error')
  }
}

// ── Types ──────────────────────────────────────────────
interface Transaction {
  id: string
  type: string
  amount: number
  category: string
  description: string
  date: string
  createdAt: string
  updatedAt: string
}

interface DashboardData {
  totalSaldo: number
  totalIncomeThisMonth: number
  totalExpenseThisMonth: number
  recentTransactions: Transaction[]
  expenseByCategory: { category: string; amount: number }[]
  previousMonthSaldo: number
  percentageChange: number
}

interface TransactionsResponse {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ReportData {
  monthlyTrend: { month: string; income: number; expense: number }[]
  categoryBreakdown: { category: string; amount: number; percentage: number }[]
}

// ── Category Icon Map ──────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Gaji: <Briefcase className="h-4 w-4" />,
  Freelance: <Laptop className="h-4 w-4" />,
  Investasi: <Landmark className="h-4 w-4" />,
  Makanan: <UtensilsCrossed className="h-4 w-4" />,
  Transportasi: <Car className="h-4 w-4" />,
  Belanja: <ShoppingBag className="h-4 w-4" />,
  Hiburan: <Gamepad2 className="h-4 w-4" />,
  Tagihan: <Receipt className="h-4 w-4" />,
  Kesehatan: <Heart className="h-4 w-4" />,
  Pendidikan: <GraduationCap className="h-4 w-4" />,
  Lainnya: <CircleDollarSign className="h-4 w-4" />,
}

// ── Form Schema ────────────────────────────────────────
const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().min(1, 'Jumlah harus lebih dari 0'),
  category: z.string().min(1, 'Pilih kategori'),
  description: z.string().min(1, 'Deskripsi wajib diisi').max(200),
  date: z.string().min(1, 'Tanggal wajib diisi'),
})

type TransactionForm = z.infer<typeof transactionSchema>

// ── Sidebar Nav Items ──────────────────────────────────
const NAV_ITEMS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'riwayat', label: 'Riwayat', icon: <Clock className="h-5 w-5" /> },
  { id: 'laporan', label: 'Laporan', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'tambah', label: 'Tambah Transaksi', icon: <PlusCircle className="h-5 w-5" /> },
]

// ── Chart Colors ───────────────────────────────────────
const PIE_COLORS = ['#e11d48', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6']

const pieChartConfig: ChartConfig = {
  Makanan: { color: '#e11d48', label: 'Makanan' },
  Transportasi: { color: '#f59e0b', label: 'Transportasi' },
  Belanja: { color: '#3b82f6', label: 'Belanja' },
  Hiburan: { color: '#ec4899', label: 'Hiburan' },
  Tagihan: { color: '#8b5cf6', label: 'Tagihan' },
  Kesehatan: { color: '#14b8a6', label: 'Kesehatan' },
  Pendidikan: { color: '#6366f1', label: 'Pendidikan' },
  Lainnya: { color: '#64748b', label: 'Lainnya' },
}

const barChartConfig: ChartConfig = {
  income: { color: '#059669', label: 'Pemasukan' },
  expense: { color: '#e11d48', label: 'Pengeluaran' },
}

// ── Animation Variants ─────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

// ── Main Component ─────────────────────────────────────
export default function Home() {
  const { activeTab, setActiveTab } = useAppStore()
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(false)

  return (
    <div className="min-h-screen flex bg-[#f8f9ff]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#e2e8f0] z-30">
        <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileNavVisible && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsMobileNavVisible(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-[#e2e8f0] z-50 lg:hidden transform transition-transform duration-200 ${
          isMobileNavVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsMobileNavVisible(false) }} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pb-20 lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-[#e2e8f0] px-4 py-3 flex items-center justify-between">
          <button onClick={() => setIsMobileNavVisible(true)} className="p-1.5 rounded-md hover:bg-secondary" aria-label="Buka menu">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
          <span className="font-bold text-[#4f46e5]">TabunganKu</span>
          <div className="w-8" />
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
                <DashboardTab onNavigate={setActiveTab} />
              </motion.div>
            )}
            {activeTab === 'riwayat' && (
              <motion.div key="riwayat" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
                <RiwayatTab />
              </motion.div>
            )}
            {activeTab === 'laporan' && (
              <motion.div key="laporan" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
                <LaporanTab />
              </motion.div>
            )}
            {activeTab === 'tambah' && (
              <motion.div key="tambah" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
                <TambahTab />
              </motion.div>
            )}
            {activeTab === 'pengaturan' && (
              <motion.div key="pengaturan" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
                <PengaturanTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2e8f0] z-30 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-[56px] ${
                activeTab === item.id
                  ? 'text-[#4f46e5]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={item.label}
            >
              {item.icon}
              <span className="text-[10px] leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// ── Sidebar Content ────────────────────────────────────
function SidebarContent({ activeTab, setActiveTab }: { activeTab: TabType; setActiveTab: (tab: TabType) => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-[#e2e8f0]">
        <h1 className="text-xl font-bold text-[#4f46e5]">TabunganKu</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Kelola Keuangan Anda</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-[#4f46e5] text-white'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-[#e2e8f0] space-y-1">
        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'pengaturan'
              ? 'bg-[#4f46e5] text-white'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Settings className="h-5 w-5" />
          Pengaturan
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <LogOut className="h-5 w-5" />
          Keluar
        </button>
      </div>
    </div>
  )
}

// ── Dashboard Tab ──────────────────────────────────────
function DashboardTab({ onNavigate }: { onNavigate: (tab: TabType) => void }) {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<DashboardData>('/api/dashboard'),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-36 w-full rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Halo, Budi 👋</h2>
          <p className="text-muted-foreground text-sm mt-1">Berikut ringkasan keuangan Anda hari ini.</p>
        </div>
        <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Gagal memuat data. Pastikan database sudah terhubung.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Coba Lagi</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const expenseByCategory = data.expenseByCategory ?? []
  const recentTransactions = data.recentTransactions ?? []
  const saldoPositive = data.percentageChange >= 0
  const pieData = expenseByCategory.map((item) => ({
    name: item.category,
    value: item.amount,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Halo, Budi 👋</h2>
        <p className="text-muted-foreground text-sm mt-1">Berikut ringkasan keuangan Anda hari ini.</p>
      </div>

      {/* Total Saldo Card */}
      <Card className="bg-gradient-to-br from-[#4f46e5] to-[#6366f1] text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-200">Total Saldo</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(data.totalSaldo)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {saldoPositive ? (
                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-300" />
                )}
                <span className={`text-sm font-medium ${saldoPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {saldoPositive ? '+' : ''}{data.percentageChange.toFixed(1)}% dari bulan lalu
                </span>
              </div>
            </div>
            <Wallet className="h-12 w-12 text-indigo-200 opacity-60" />
          </div>
        </CardContent>
      </Card>

      {/* Income & Expense Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pemasukan Bulan Ini</p>
                <p className="text-xl font-bold text-[#059669] mt-1">{formatCurrency(data.totalIncomeThisMonth)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-[#059669]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pengeluaran Bulan Ini</p>
                <p className="text-xl font-bold text-[#e11d48] mt-1">{formatCurrency(data.totalExpenseThisMonth)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-[#e11d48]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category Donut */}
        <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {pieData.length > 0 ? (
              <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Belum ada pengeluaran bulan ini
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Transaksi Terbaru</CardTitle>
            <button
              onClick={() => onNavigate('riwayat')}
              className="text-sm text-[#4f46e5] font-medium hover:underline"
            >
              Lihat Semua
            </button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: tx.type === 'income' ? '#ecfdf5' : '#fff1f2',
                        color: tx.type === 'income' ? '#059669' : '#e11d48',
                      }}
                    >
                      {CATEGORY_ICONS[tx.category] || <CircleDollarSign className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ml-3 ${
                      tx.type === 'income' ? 'text-[#059669]' : 'text-[#e11d48]'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Riwayat Tab ────────────────────────────────────────
function RiwayatTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 10

  // Compute date params from range
  const getDateParams = () => {
    const now = new Date()
    if (dateRange === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      return `&startDate=${start}&endDate=${end}`
    }
    if (dateRange === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      return `&startDate=${start}&endDate=${end}`
    }
    return ''
  }

  const { data, isLoading, isError } = useQuery<TransactionsResponse>({
    queryKey: ['transactions', { search, category, type, dateRange, page, limit }],
    queryFn: () =>
      apiFetch<TransactionsResponse>(
        `/api/transactions?search=${search}&category=${category}&type=${type}${getDateParams()}&page=${page}&limit=${limit}`
      ),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/transactions/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Transaksi berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => {
      toast.error('Gagal menghapus transaksi')
    },
  })

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setType('')
    setDateRange('all')
    setPage(1)
  }

  const hasFilters = search || category || type || dateRange !== 'all'

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Riwayat Transaksi</h2>

      {/* Error State */}
      {isError && (
        <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Gagal memuat data. Pastikan database sudah terhubung.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Coba Lagi</Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Waktu</SelectItem>
                <SelectItem value="this_month">Bulan Ini</SelectItem>
                <SelectItem value="last_month">Bulan Lalu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setCategory(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {INCOME_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => { setType(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="default" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4 mr-1.5" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="w-12">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Tidak ada transaksi ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                    {data?.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(tx.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {CATEGORY_ICONS[tx.category] || <CircleDollarSign className="h-4 w-4" />}
                            <span className="font-medium text-sm">{tx.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[tx.category] || '#64748b'}15`,
                              color: CATEGORY_COLORS[tx.category] || '#64748b',
                            }}
                          >
                            {tx.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          <span className={tx.type === 'income' ? 'text-[#059669]' : 'text-[#e11d48]'}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-[#e11d48] focus:text-[#e11d48]"
                                onClick={() => deleteMutation.mutate(tx.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border">
                {data?.transactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">Tidak ada transaksi ditemukan</div>
                )}
                {data?.transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: tx.type === 'income' ? '#ecfdf5' : '#fff1f2',
                          color: tx.type === 'income' ? '#059669' : '#e11d48',
                        }}
                      >
                        {CATEGORY_ICONS[tx.category] || <CircleDollarSign className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[tx.category] || '#64748b'}15`,
                              color: CATEGORY_COLORS[tx.category] || '#64748b',
                            }}
                          >
                            {tx.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-[#059669]' : 'text-[#e11d48]'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-[#e11d48] focus:text-[#e11d48]"
                            onClick={() => deleteMutation.mutate(tx.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {((data.page - 1) * data.limit) + 1}–{Math.min(data.page * data.limit, data.total)} dari {data.total} transaksi
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, data.totalPages) }).map((_, i) => {
              let pageNum: number
              if (data.totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= data.totalPages - 2) {
                pageNum = data.totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Laporan Tab ────────────────────────────────────────
function LaporanTab() {
  const { data, isLoading, isError } = useQuery<ReportData>({
    queryKey: ['reports'],
    queryFn: () => apiFetch<ReportData>('/api/reports?months=6'),
  })

  if (isError) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Laporan Pengeluaran</h2>
        <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Gagal memuat data. Pastikan database sudah terhubung.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Coba Lagi</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const monthlyTrend = data?.monthlyTrend ?? []
  const categoryBreakdown = data?.categoryBreakdown ?? []

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Laporan Pengeluaran</h2>

      {/* Monthly Trend */}
      <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Tren Bulanan</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : monthlyTrend.length > 0 ? (
            <ChartContainer config={barChartConfig} className="h-[350px] w-full">
              <BarChart data={monthlyTrend} barGap={4} barCategoryGap="20%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value: number) => `${(value / 1000000).toFixed(1)}jt`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Bar dataKey="income" fill="#059669" radius={[4, 4, 0, 0]} name="Pemasukan" />
                <Bar dataKey="expense" fill="#e11d48" radius={[4, 4, 0, 0]} name="Pengeluaran" />
              </BarChart>
            </ChartContainer>
          ) : null}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Breakdown Kategori Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : categoryBreakdown.length > 0 ? (
            <div className="space-y-5">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ color: CATEGORY_COLORS[item.category] || '#64748b' }}>
                        {CATEGORY_ICONS[item.category] || <CircleDollarSign className="h-4 w-4" />}
                      </span>
                      <span className="text-sm font-medium">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[item.category] || '#64748b',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada data pengeluaran bulan ini</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Tambah Transaksi Tab ───────────────────────────────
function TambahTab() {
  const queryClient = useQueryClient()
  const { setActiveTab } = useAppStore()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: undefined,
      category: '',
      description: '',
      date: getTodayISO(),
    },
  })

  const selectedType = watch('type')

  const categories = selectedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const createMutation = useMutation({
    mutationFn: (data: TransactionForm) =>
      fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Transaksi berhasil ditambahkan!')
      reset({
        type: 'expense',
        amount: undefined,
        category: '',
        description: '',
        date: getTodayISO(),
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setActiveTab('dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambahkan transaksi')
    },
  })

  const onSubmit = (data: TransactionForm) => {
    createMutation.mutate(data)
  }

  // Reset category when type changes
  useEffect(() => {
    setValue('category', '')
  }, [selectedType, setValue])

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">Tambah Transaksi</h2>

      <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Type Toggle */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tipe Transaksi</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('type', 'income')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${
                    selectedType === 'income'
                      ? 'bg-[#059669] border-[#059669] text-white'
                      : 'bg-white border-[#e2e8f0] text-muted-foreground hover:border-[#059669]/50'
                  }`}
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setValue('type', 'expense')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${
                    selectedType === 'expense'
                      ? 'bg-[#e11d48] border-[#e11d48] text-white'
                      : 'bg-white border-[#e2e8f0] text-muted-foreground hover:border-[#e11d48]/50'
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Pengeluaran
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium mb-2 block">Jumlah</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Rp</span>
                <Input
                  type="number"
                  placeholder="0"
                  className="pl-10 text-lg font-semibold h-12"
                  {...register('amount')}
                />
              </div>
              {errors.amount && <p className="text-xs text-[#e11d48] mt-1">{errors.amount.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-2 block">Kategori</label>
              <Select
                value={watch('category')}
                onValueChange={(v) => setValue('category', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register('category')} />
              {errors.category && <p className="text-xs text-[#e11d48] mt-1">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">Deskripsi</label>
              <Input
                placeholder="Deskripsi transaksi..."
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-[#e11d48] mt-1">{errors.description.message}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tanggal</label>
              <Input type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-[#e11d48] mt-1">{errors.date.message}</p>}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold text-white transition-all"
              disabled={isSubmitting}
              style={{
                backgroundColor: selectedType === 'income' ? '#059669' : '#e11d48',
              }}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Pengaturan Tab ─────────────────────────────────────
function PengaturanTab() {
  const queryClient = useQueryClient()
  const { setActiveTab } = useAppStore()
  const [showConfirm, setShowConfirm] = useState(false)

  const { data: countData } = useQuery<{ total: number }>({
    queryKey: ['transactions-count'],
    queryFn: () => apiFetch<{ total: number }>('/api/transactions?limit=1'),
  })

  const resetMutation = useMutation({
    mutationFn: () => apiFetch<{ success: boolean; deletedCount: number; message: string }>('/api/transactions/reset', { method: 'DELETE' }),
    onSuccess: (data) => {
      toast.success(data.message || 'Semua data berhasil direset')
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['transactions-count'] })
      setShowConfirm(false)
    },
    onError: () => {
      toast.error('Gagal mereset data. Silakan coba lagi.')
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Pengaturan</h2>
        <p className="text-sm text-muted-foreground mt-1">Kelola preferensi dan data aplikasi Anda</p>
      </div>

      {/* App Info Card */}
      <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-[#4f46e5]" />
            Informasi Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-[#e2e8f0]">
            <span className="text-sm text-muted-foreground">Total Transaksi</span>
            <span className="text-sm font-semibold text-foreground">
              {countData?.total ?? '...'} transaksi
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#e2e8f0]">
            <span className="text-sm text-muted-foreground">Versi Aplikasi</span>
            <span className="text-sm font-semibold text-foreground">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Penyimpanan</span>
            <span className="text-sm font-semibold text-foreground">Lokal (SQLite)</span>
          </div>
        </CardContent>
      </Card>

      {/* Reset Card */}
      <Card className="border-[#e2e8f0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#e11d48]" />
            Zona Berbahaya
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
            <Info className="h-4 w-4 text-[#e11d48] mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 leading-relaxed">
              Menghapus semua data transaksi tidak dapat dibatalkan. Pastikan Anda sudah mem-backup data penting sebelum melanjutkan.
            </p>
          </div>

          {!showConfirm ? (
            <Button
              variant="outline"
              className="w-full border-[#e11d48] text-[#e11d48] hover:bg-[#e11d48] hover:text-white transition-colors font-medium"
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Semua Data
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-lg border-2 border-[#e11d48]/30 bg-red-50/50">
              <p className="text-sm font-medium text-foreground">
                Apakah Anda yakin ingin menghapus semua data?
              </p>
              <p className="text-xs text-muted-foreground">
                Tindakan ini akan menghapus seluruh {countData?.total ?? '...'} transaksi secara permanen.
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                  disabled={resetMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-[#e11d48] text-white hover:bg-[#be123c] font-medium"
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Ya, Hapus Semua
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* After reset — empty state prompt */}
      {countData?.total === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">Data transaksi kosong. Mulai catat transaksi pertama Anda!</p>
          <Button
            onClick={() => setActiveTab('tambah')}
            className="bg-[#4f46e5] text-white hover:bg-[#4338ca] font-medium"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Tambah Transaksi
          </Button>
        </div>
      )}
    </div>
  )
}