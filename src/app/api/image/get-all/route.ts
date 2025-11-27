import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = await (prisma as any).image.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true, 
      result: images 
    })

  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch images' 
    }, { status: 500 })
  }
} 