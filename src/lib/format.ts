const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

export function formatMonth(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export const INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Investasi', 'Lainnya']
export const EXPENSE_CATEGORIES = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Lainnya']

export const CATEGORY_COLORS: Record<string, string> = {
  Gaji: '#4f46e5',
  Freelance: '#8b5cf6',
  Investasi: '#059669',
  Makanan: '#f59e0b',
  Transportasi: '#3b82f6',
  Belanja: '#ec4899',
  Hiburan: '#f97316',
  Tagihan: '#e11d48',
  Kesehatan: '#14b8a6',
  Pendidikan: '#6366f1',
  Lainnya: '#64748b',
}