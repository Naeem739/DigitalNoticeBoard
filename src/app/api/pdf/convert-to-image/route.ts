import { NextRequest, NextResponse } from 'next/server'
import gm from 'gm'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

// Use ImageMagick with Ghostscript support
const im = gm.subClass({ imageMagick: true })

export async function POST(request: NextRequest) {
  let tempPdfPath: string | null = null
  
  try {
    const formData = await request.formData()
    const pdfData = formData.get('pdfData') as string

    if (!pdfData) {
      return NextResponse.json({ 
        success: false, 
        error: 'PDF data is required' 
      }, { status: 400 })
    }

    // Extract base64 data from data URL if needed
    let base64Data = pdfData
    if (pdfData.startsWith('data:application/pdf;base64,')) {
      base64Data = pdfData.split(',')[1]
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(base64Data, 'base64')
    
    // Create temporary file path
    tempPdfPath = join(tmpdir(), `pdf-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`)

    try {
      // Write PDF buffer to temporary file
      await writeFile(tempPdfPath, pdfBuffer)

      // Generate output image path
      const imagePath = join(tmpdir(), `image-${Date.now()}-${Math.random().toString(36).substring(7)}.png`)

      // Convert first page of PDF to image using ImageMagick + Ghostscript
      await new Promise((resolve, reject) => {
        im(tempPdfPath + '[0]') // [0] selects the first page
          .density(150, 150) // Set DPI for better quality
          .quality(90) // Set quality
          .trim() // Remove whitespace/margins around the image
          .borderColor('white') // Set border color for fuzz trimming
          .fuzz('10%') // Trim similar colors within 10% tolerance
          .trim() // Apply trim again with fuzz for better whitespace removal
          .write(imagePath, (err) => {
            if (err) reject(err)
            else resolve(imagePath)
          })
      })

      // Clean up temporary PDF file
      if (tempPdfPath) {
        await unlink(tempPdfPath).catch(() => {}) // Ignore errors if file doesn't exist
        tempPdfPath = null
      }

      // Read the generated image file and convert to base64
      const imageBuffer = await readFile(imagePath)
      const base64 = imageBuffer.toString('base64')

      // Clean up generated image file as well
      await unlink(imagePath).catch(() => {})

      // Return base64 image data
      const imageDataUrl = `data:image/png;base64,${base64}`

      return NextResponse.json({ 
        success: true, 
        imageData: imageDataUrl
      })

    } catch (conversionError: any) {
      // Clean up temporary PDF file on error
      if (tempPdfPath) {
        await unlink(tempPdfPath).catch(() => {})
        tempPdfPath = null
      }
      
      console.error('PDF conversion error:', conversionError)
      throw conversionError
    }

  } catch (error: any) {
    // Final cleanup
    if (tempPdfPath) {
      await unlink(tempPdfPath).catch(() => {})
    }
    
    console.error('Error converting PDF to image:', error)
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to convert PDF to image' 
    }, { status: 500 })
  }
}
