import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const admins = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      admins: admins
    })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch admin users'
      },
      { status: 500 }
    )
  }
}

