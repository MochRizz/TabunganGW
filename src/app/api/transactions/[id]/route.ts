import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const transaction = await db.transaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    await db.transaction.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 })
  }
}