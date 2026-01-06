import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    // Use JWT token (same as middleware) to authorize
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || ((token as any).role !== 'ADMIN' && (token as any).role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      where: {
        NOT: { role: 'SUPER_ADMIN' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Error fetching all users:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch users'
      },
      { status: 500 }
    )
  }
}
