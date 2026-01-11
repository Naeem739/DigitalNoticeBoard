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

    if (!pdf.pdfUrl) {
      return NextResponse.json({ error: 'No PDF URL available' }, { status: 404 })
    }

    try {
      // Fetch PDF from Supabase Storage
      const response = await fetch(pdf.pdfUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()

      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${pdf.fileName || pdf.title || 'document'}.pdf"`
        }
      })
    } catch (error) {
      console.error('Error fetching PDF from Supabase:', error)
      return NextResponse.json(
        { error: 'Failed to fetch PDF file' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error handling PDF download:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF download' },
      { status: 500 }
    )
  }
}

