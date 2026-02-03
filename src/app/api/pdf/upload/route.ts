import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { uploadPDF, uploadImage } from '@/lib/supabase'
import pdfPoppler from 'pdf-poppler'
import sharp from 'sharp'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

export async function POST(request: NextRequest) {
  let tempPdfPath: string | null = null
  let outputImagePath: string | null = null
  
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

    // Generate high-quality preview image from first page
    let previewImageUrl: string | null = null
    let previewImageFileName: string | null = null
    
    try {
      // Create temporary file path for PDF
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      tempPdfPath = join(tmpdir(), `pdf-${uniqueId}.pdf`)
      await writeFile(tempPdfPath, buffer)

      // Convert PDF first page to high-quality PNG using pdf-poppler (600 DPI for maximum quality)
      const outputDir = tmpdir()
      const outputPrefix = `preview-${uniqueId}`
      
      const opts = {
        format: 'png' as const,
        out_dir: outputDir,
        out_prefix: outputPrefix,
        page: 1,                    // First page only
        scale: 600,                 // 600 DPI for exceptional quality (double the standard)
        single_file: true           // Generate single file
      }

      // Convert PDF to PNG using pdf-poppler
      await pdfPoppler.convert(tempPdfPath, opts)
      
      // The output file will be named: {out_prefix}-1.png
      outputImagePath = join(outputDir, `${outputPrefix}-1.png`)
      
      // Read the generated preview image
      let imageBuffer = await readFile(outputImagePath)
      
      // Use sharp to enhance and optimize the image quality
      imageBuffer = await sharp(imageBuffer)
        .png({
          quality: 100,             // Maximum quality
          compressionLevel: 6,      // Balanced compression
          adaptiveFiltering: true,  // Better compression without quality loss
          palette: false,           // Use full RGB color space (no palette)
        })
        .sharpen({
          sigma: 1.0,               // Enhanced sharpening for superior clarity
          m1: 1.0,                  // Flat areas - moderate sharpening
          m2: 2.0,                  // Jagged areas - strong sharpening
          x1: 2,                    // Sharpening threshold
          y2: 10,                   // Maximum sharpening
          y3: 20                    // Sharpening slope
        })
        .modulate({
          brightness: 1.05,         // Slightly increase brightness (5%)
          saturation: 1.1,          // Enhance color saturation (10%)
        })
        .normalize()                // Auto-adjust contrast for better visibility
        .toBuffer()
      
      // Upload preview image to Supabase
      const previewFileName = `${file.name.replace('.pdf', '')}-preview.png`
      const imageUploadResult = await uploadImage(imageBuffer, previewFileName)
      
      if (!imageUploadResult.error && imageUploadResult.url) {
        previewImageUrl = imageUploadResult.url
        previewImageFileName = previewFileName
        console.log('Preview image uploaded successfully:', previewImageUrl)
      }
      
      // Clean up temporary files
      if (tempPdfPath) await unlink(tempPdfPath).catch(() => {})
      if (outputImagePath) await unlink(outputImagePath).catch(() => {})
      
    } catch (conversionError) {
      console.error('Error generating preview image:', conversionError)
      // Continue even if preview generation fails
      if (tempPdfPath) await unlink(tempPdfPath).catch(() => {})
      if (outputImagePath) await unlink(outputImagePath).catch(() => {})
    }

    // Save to database with PDF URL and preview image URL
    const pdf = await prisma.pdf.create({
      data: {
        title,
        fileName: file.name,
        pdfUrl: uploadResult.url,
        fileSize: file.size,
        previewImageUrl: previewImageUrl,
        previewImageFileName: previewImageFileName,
      }
    })

    return NextResponse.json({ 
      success: true, 
      result: pdf 
    })

  } catch (error) {
    // Final cleanup
    if (tempPdfPath) await unlink(tempPdfPath).catch(() => {})
    if (outputImagePath) await unlink(outputImagePath).catch(() => {})
    
    console.error('Error uploading PDF:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload PDF' 
    }, { status: 500 })
  }
}
