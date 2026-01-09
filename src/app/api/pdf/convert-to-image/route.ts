import { NextRequest, NextResponse } from 'next/server'
import { fromPath } from 'pdf2pic'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

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
      // Write PDF buffer to temporary file (pdf2pic needs a file path)
      await writeFile(tempPdfPath, pdfBuffer)

      // Convert first page of PDF to image using pdf2pic
      const options = {
        density: 100,           // DPI
        saveFilename: `image-${Date.now()}`,
        savePath: tmpdir(),
        format: 'png',
        width: 2000,
        height: 2000
      }

      // Convert first page of PDF to image using pdf2pic
      const convert = fromPath(tempPdfPath, options)
      
      // Convert first page (page 1). pdf2pic will write a PNG file to disk.
      // The result object contains the path to the generated image.
      const result = await convert(1)

      // Clean up temporary PDF file
      if (tempPdfPath) {
        await unlink(tempPdfPath).catch(() => {}) // Ignore errors if file doesn't exist
        tempPdfPath = null
      }

      if (!result || !result.path) {
        throw new Error('Failed to convert PDF to image - no image path returned')
      }

      // Read the generated image file and convert to base64
      const imageBuffer = await readFile(result.path)
      const base64 = imageBuffer.toString('base64')

      // Clean up generated image file as well
      await unlink(result.path).catch(() => {})

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
