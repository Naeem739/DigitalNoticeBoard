import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const images = await prisma.image.findMany({
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