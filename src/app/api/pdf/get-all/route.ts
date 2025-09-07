import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const pdfs = await prisma.pdf.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true, 
      result: pdfs 
    })

  } catch (error) {
    console.error('Error fetching PDFs:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch PDFs' 
    }, { status: 500 })
  }
}
