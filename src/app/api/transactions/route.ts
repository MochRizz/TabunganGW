import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const type = searchParams.get('type') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))

    const where: Record<string, unknown> = {}

    if (search) {
      where.description = { contains: search }
    }
    if (category) {
      where.category = category
    }
    if (type) {
      where.type = type
    }
    if (startDate || endDate) {
      where.date = {} as Record<string, unknown>
      if (startDate) {
        (where.date as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.date as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.transaction.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ])

    return NextResponse.json({
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ transactions: [], total: 0, page: 1, limit: 10, totalPages: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, amount, category, description, date } = body

    if (!type || !amount || !category || !description || !date) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipe harus income atau expense' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Jumlah harus lebih dari 0' },
        { status: 400 }
      )
    }

    const transaction = await db.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date),
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Gagal membuat transaksi. Database belum terhubung.' }, { status: 500 })
  }
}