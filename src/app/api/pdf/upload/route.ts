import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string

    if (!file || !title) {
      return NextResponse.json({ 
        success: false, 
        error: 'File and title are required' 
      }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only PDF files are allowed' 
      }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64Data}`

    // Save to database
    const pdf = await prisma.pdf.create({
      data: {
        title,
        fileName: file.name,
        pdfData: dataUrl,
        fileSize: file.size,
      }
    })

    return NextResponse.json({ 
      success: true, 
      result: pdf 
    })

  } catch (error) {
    console.error('Error uploading PDF:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload PDF' 
    }, { status: 500 })
  }
}
