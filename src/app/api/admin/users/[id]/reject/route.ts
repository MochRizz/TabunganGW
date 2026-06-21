import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

async function getUserFromRequest(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return null
  return db.user.findUnique({ where: { id: userId } })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const { id } = await params

    const targetUser = await db.user.findUnique({
      where: { id },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    await db.user.update({
      where: { id },
      data: { status: 'rejected' },
    })

    return NextResponse.json({
      success: true,
      message: 'Permintaan akun ditolak',
    })
  } catch (error) {
    console.error('Error rejecting user:', error)
    return NextResponse.json(
      { error: 'Gagal menolak akun' },
      { status: 500 }
    )
  }
}