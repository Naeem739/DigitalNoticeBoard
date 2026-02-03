import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { uploadPDF, uploadImage } from '@/lib/supabase'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createCanvas } from 'canvas'
import sharp from 'sharp'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

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

    // Generate high-quality preview image from first page using pdfjs-dist + canvas
    let previewImageUrl: string | null = null
    let previewImageFileName: string | null = null
    
    try {
      // Create temporary file path for PDF
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      tempPdfPath = join(tmpdir(), `pdf-${uniqueId}.pdf`)
      await writeFile(tempPdfPath, buffer)

      // Load PDF with pdfjs-dist (serverless-compatible)
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
      })
      const pdfDocument = await loadingTask.promise
      
      // Get first page
      const page = await pdfDocument.getPage(1)
      
      // Set scale for high quality (3.0 = ~288 DPI, 4.0 = ~384 DPI, 5.0 = ~480 DPI)
      const scale = 5.0  // Very high quality for sharp, clear output
      const viewport = page.getViewport({ scale })
      
      // Create canvas with high resolution
      const canvas = createCanvas(viewport.width, viewport.height)
      const context = canvas.getContext('2d')
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context as any,
        viewport: viewport,
        canvas: canvas as any,
      }).promise
      
      // Convert canvas to buffer
      let imageBuffer = canvas.toBuffer('image/png', {
        compressionLevel: 6,
      })
      
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
