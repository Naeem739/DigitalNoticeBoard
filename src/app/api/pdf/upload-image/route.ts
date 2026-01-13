import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/supabase'

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

    // Validate that it's an image file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Only image files are allowed' 
      }, { status: 400 })
    }

    // Upload image to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate filename: pdf-preview-{timestamp}-{random}.png
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const fileName = `pdf-preview-${timestamp}-${random}.png`
    
    const uploadResult = await uploadImage(buffer, fileName)

    if (uploadResult.error || !uploadResult.url) {
      const errorMsg = uploadResult.error || 'Supabase upload returned no URL'
      console.error('Error uploading PDF image to Supabase:', errorMsg)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to upload PDF image: ${errorMsg}` 
      }, { status: 500 })
    }

    // Return only the URL
    return NextResponse.json({ 
      success: true, 
      url: uploadResult.url,
      fileName: fileName
    })

  } catch (error) {
    console.error('Error uploading PDF image:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload PDF image' 
    }, { status: 500 })
  }
}
