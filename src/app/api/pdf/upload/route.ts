import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { uploadPDF } from '@/lib/supabase'

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

    // Upload file to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadResult = await uploadPDF(buffer, file.name)

    if (uploadResult.error || !uploadResult.url) {
      const errorMsg = uploadResult.error || 'Supabase upload returned no URL'
      console.error('Error uploading PDF to Supabase:', errorMsg)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to upload PDF: ${errorMsg}` 
      }, { status: 500 })
    }

    // Save to database with URL only
    const pdf = await prisma.pdf.create({
      data: {
        title,
        fileName: file.name,
        pdfUrl: uploadResult.url,
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
