import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const result = await db.transaction.deleteMany({})
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