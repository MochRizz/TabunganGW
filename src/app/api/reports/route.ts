import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

async function getUserFromRequest(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return null
  return db.user.findUnique({ where: { id: userId } })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ monthlyTrend: [], categoryBreakdown: [] })
    }

    const { searchParams } = new URL(request.url)
    const months = Math.min(12, Math.max(1, parseInt(searchParams.get('months') || '6')))

    const now = new Date()
    const monthlyTrend: { month: string; income: number; expense: number }[] = []

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

      const monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

      const [incomeResult, expenseResult] = await Promise.all([
        db.transaction.aggregate({
          where: { type: 'income', date: { gte: monthStart, lte: monthEnd }, userId: user.id },
          _sum: { amount: true },
        }),
        db.transaction.aggregate({
          where: { type: 'expense', date: { gte: monthStart, lte: monthEnd }, userId: user.id },
          _sum: { amount: true },
        }),
      ])

      monthlyTrend.push({
        month: monthLabel,
        income: incomeResult._sum.amount || 0,
        expense: expenseResult._sum.amount || 0,
      })
    }

    // Category breakdown for this month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const categoryData = await db.transaction.groupBy({
      by: ['category'],
      where: { type: 'expense', date: { gte: thisMonthStart, lte: thisMonthEnd }, userId: user.id },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    })

    const totalExpenseThisMonth = categoryData.reduce((sum, item) => sum + (item._sum.amount || 0), 0)

    const categoryBreakdown = categoryData.map((item) => ({
      category: item.category,
      amount: item._sum.amount || 0,
      percentage: totalExpenseThisMonth > 0 ? ((item._sum.amount || 0) / totalExpenseThisMonth) * 100 : 0,
    }))

    return NextResponse.json({
      monthlyTrend,
      categoryBreakdown,
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ monthlyTrend: [], categoryBreakdown: [] })
  }
}