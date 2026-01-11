import { NextRequest, NextResponse } from 'next/server'
import { uploadPDF } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'File is required' 
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

    if (uploadResult.error) {
      console.error('Error uploading PDF to Supabase:', uploadResult.error)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to upload PDF: ${uploadResult.error}` 
      }, { status: 500 })
    }

    // Return only the URL (no database save)
    return NextResponse.json({ 
      success: true, 
      url: uploadResult.url,
      fileName: file.name
    })

  } catch (error) {
    console.error('Error uploading PDF:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload PDF' 
    }, { status: 500 })
  }
}

