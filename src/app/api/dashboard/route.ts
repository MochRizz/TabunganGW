import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

async function getUserFromRequest(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return null
  return db.user.findUnique({ where: { id: userId } })
}

const EMPTY_DASHBOARD = {
  totalSaldo: 0,
  totalIncomeThisMonth: 0,
  totalExpenseThisMonth: 0,
  recentTransactions: [],
  expenseByCategory: [],
  previousMonthSaldo: 0,
  percentageChange: 0,
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(EMPTY_DASHBOARD)
    }

    const userIdFilter = { userId: user.id }

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    const [
      totalIncome,
      totalExpense,
      incomeThisMonth,
      expenseThisMonth,
      previousMonthIncome,
      previousMonthExpense,
      recentTransactions,
      expenseByCategory,
    ] = await Promise.all([
      db.transaction.aggregate({
        where: { type: 'income', ...userIdFilter },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'expense', ...userIdFilter },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'income', date: { gte: thisMonthStart, lte: thisMonthEnd }, ...userIdFilter },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'expense', date: { gte: thisMonthStart, lte: thisMonthEnd }, ...userIdFilter },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'income', date: { gte: lastMonthStart, lte: lastMonthEnd }, ...userIdFilter },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'expense', date: { gte: lastMonthStart, lte: lastMonthEnd }, ...userIdFilter },
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        where: userIdFilter,
        orderBy: { date: 'desc' },
        take: 5,
      }),
      db.transaction.groupBy({
        by: ['category'],
        where: { type: 'expense', date: { gte: thisMonthStart, lte: thisMonthEnd }, ...userIdFilter },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
    ])

    const totalSaldo = (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0)
    const totalIncomeThisMonth = incomeThisMonth._sum.amount || 0
    const totalExpenseThisMonth = expenseThisMonth._sum.amount || 0
    const prevMonthIncomeAmt = previousMonthIncome._sum.amount || 0
    const prevMonthExpenseAmt = previousMonthExpense._sum.amount || 0
    const previousMonthSaldo = prevMonthIncomeAmt - prevMonthExpenseAmt

    const thisMonthNet = totalIncomeThisMonth - totalExpenseThisMonth
    const percentageChange = previousMonthSaldo !== 0
      ? ((thisMonthNet - previousMonthSaldo) / Math.abs(previousMonthSaldo)) * 100
      : thisMonthNet > 0 ? 100 : 0

    const response: Record<string, unknown> = {
      totalSaldo,
      totalIncomeThisMonth,
      totalExpenseThisMonth,
      recentTransactions,
      expenseByCategory: expenseByCategory.map((item) => ({
        category: item.category,
        amount: item._sum.amount || 0,
      })),
      previousMonthSaldo,
      percentageChange,
    }

    // Admin gets additional stats
    if (user.role === 'admin') {
      const [totalUsers, pendingUsers] = await Promise.all([
        db.user.count(),
        db.user.count({ where: { status: 'pending' } }),
      ])
      response.allUsersStats = {
        totalUsers,
        pendingCount: pendingUsers,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(EMPTY_DASHBOARD)
  }
}