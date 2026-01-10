import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pdf = await prisma.pdf.findUnique({
      where: { id }
    })

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    if (!pdf.pdfData) {
      return NextResponse.json({ error: 'No PDF data available' }, { status: 404 })
    }

    // pdfData can be stored in different formats:
    // 1. Data URL: data:application/pdf;base64,XXXX
    // 2. Just base64: XXXX (raw base64 string)
    let base64Data = pdf.pdfData
    
    // Remove data URL prefix if present
    if (base64Data.startsWith('data:application/pdf;base64,')) {
      base64Data = base64Data.replace('data:application/pdf;base64,', '')
    } else if (base64Data.startsWith('data:')) {
      // Handle other data URL formats
      base64Data = base64Data.split(',')[1] || base64Data
    }
    // If it's already just base64, use it as-is
    
    const pdfBuffer = Buffer.from(base64Data, 'base64')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdf.fileName || pdf.title || 'document'}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error handling PDF download:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF download' },
      { status: 500 }
    )
  }
}

