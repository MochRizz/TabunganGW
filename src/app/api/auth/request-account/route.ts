import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama wajib diisi' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { name: name.trim() },
    })

    if (existingUser) {
      if (existingUser.status === 'pending') {
        return NextResponse.json(
          { error: 'Permintaan akun sudah dikirim' },
          { status: 400 }
        )
      }
      if (existingUser.status === 'approved') {
        return NextResponse.json(
          { error: 'Akun sudah terdaftar, silakan masuk' },
          { status: 400 }
        )
      }
      if (existingUser.status === 'rejected') {
        const updatedUser = await db.user.update({
          where: { id: existingUser.id },
          data: { status: 'pending' },
        })
        return NextResponse.json({
          id: updatedUser.id,
          name: updatedUser.name,
          role: updatedUser.role,
          status: updatedUser.status,
        })
      }
    }

    const user = await db.user.create({
      data: {
        name: name.trim(),
        role: 'user',
        status: 'pending',
      },
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      role: user.role,
      status: user.status,
    }, { status: 201 })
  } catch (error) {
    console.error('Error requesting account:', error)
    return NextResponse.json(
      { error: 'Gagal memproses permintaan akun' },
      { status: 500 }
    )
  }
}