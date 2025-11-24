/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const moderators = await prisma.user.findMany({
      where: {
        role: 'MODERATOR'
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
      moderators
    })
  } catch (error) {
    console.error('Error fetching moderators:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch moderators'
      },
      { status: 500 }
    )
  }
}
