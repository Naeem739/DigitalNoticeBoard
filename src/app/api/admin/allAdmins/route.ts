/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN' // Use proper enum value
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true, // Include role field
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

