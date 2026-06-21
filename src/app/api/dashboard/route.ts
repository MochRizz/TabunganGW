import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const EMPTY_DASHBOARD = {
  totalSaldo: 0,
  totalIncomeThisMonth: 0,
  totalExpenseThisMonth: 0,
  recentTransactions: [],
  expenseByCategory: [],
  previousMonthSaldo: 0,
  percentageChange: 0,
}

export async function GET() {
  try {
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
        where: { type: 'income' },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'expense' },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'income', date: { gte: thisMonthStart, lte: thisMonthEnd } },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'expense', date: { gte: thisMonthStart, lte: thisMonthEnd } },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'income', date: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'expense', date: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        orderBy: { date: 'desc' },
        take: 5,
      }),
      db.transaction.groupBy({
        by: ['category'],
        where: { type: 'expense', date: { gte: thisMonthStart, lte: thisMonthEnd } },
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

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(EMPTY_DASHBOARD)
  }
}