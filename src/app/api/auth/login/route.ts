import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, pin } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama wajib diisi' },
        { status: 400 }
      )
    }

    // Admin login with PIN
    if (pin) {
      if (name.trim() === 'Admin' && pin === '1234') {
        let adminUser = await db.user.findUnique({
          where: { name: 'Admin' },
        })

        if (!adminUser) {
          adminUser = await db.user.create({
            data: {
              name: 'Admin',
              role: 'admin',
              status: 'approved',
            },
          })
        }

        return NextResponse.json({
          id: adminUser.id,
          name: adminUser.name,
          role: adminUser.role,
          status: adminUser.status,
        })
      }

      return NextResponse.json(
        { error: 'PIN salah' },
        { status: 401 }
      )
    }

    // Regular user login (no PIN)
    const user = await db.user.findFirst({
      where: {
        name: name.trim(),
        status: 'approved',
      },
    })

    if (!user) {
      // Check if user exists but is pending
      const pendingUser = await db.user.findUnique({
        where: { name: name.trim() },
      })

      if (pendingUser && pendingUser.status === 'pending') {
        return NextResponse.json(
          { error: 'Akun Anda masih menunggu persetujuan admin' },
          { status: 403 }
        )
      }

      if (pendingUser && pendingUser.status === 'rejected') {
        return NextResponse.json(
          { error: 'Akun Anda ditolak. Silakan ajukan kembali.' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      role: user.role,
      status: user.status,
    })
  } catch (error) {
    console.error('Error logging in:', error)
    return NextResponse.json(
      { error: 'Gagal melakukan login' },
      { status: 500 }
    )
  }
}