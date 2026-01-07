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

    // pdfData is stored as a data URL: data:application/pdf;base64,XXXX
    const base64Data = pdf.pdfData.replace(/^data:application\/pdf;base64,/, '')
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

