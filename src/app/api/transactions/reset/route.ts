import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

async function getUserFromRequest(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return null
  return db.user.findUnique({ where: { id: userId } })
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const where = user.role === 'admin' ? {} : { userId: user.id }

    const result = await db.transaction.deleteMany({ where })
    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Berhasil menghapus ${result.count} transaksi`,
    })
  } catch (error) {
    console.error('Error resetting transactions:', error)
    return NextResponse.json({ error: 'Gagal mereset data transaksi' }, { status: 500 })
  }
}