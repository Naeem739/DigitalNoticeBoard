'use server'

import { prisma } from "@/db/prisma"
import { uploadPDF } from "@/lib/supabase"

export type TPdf = {
  id: string
  title: string
  pdfUrl: string
  fileName: string
  fileSize?: number
  createdAt?: Date
  updatedAt?: Date
}

export const createPdf = async (value: Omit<TPdf, "id" | "createdAt" | "updatedAt"> & { pdfData?: string }) => {
  try {
    console.log("Creating PDF with data:", {
      title: value.title,
      fileName: value.fileName,
      hasUrl: !!value.pdfUrl,
      hasData: !!value.pdfData
    })
    
    // Handle file upload if pdfData is provided but pdfUrl is not
    let pdfUrl = value.pdfUrl
    if (value.pdfData && !pdfUrl) {
      const pdfBuffer = Buffer.from(value.pdfData, 'base64')
      const uploadResult = await uploadPDF(pdfBuffer, value.fileName)
      if (uploadResult.error || !uploadResult.url) {
        const errorMsg = uploadResult.error || 'Supabase upload returned no URL'
        console.error("Error uploading PDF to Supabase:", errorMsg)
        return { success: false, message: `Failed to upload PDF: ${errorMsg}` }
      }
      pdfUrl = uploadResult.url
    }
    
    if (!pdfUrl) {
      return { success: false, message: "PDF URL or data is required" }
    }
    
    const result = await prisma.pdf.create({
      data: {
        title: value.title,
        pdfUrl: pdfUrl,
        fileName: value.fileName,
        fileSize: value.fileSize,
      }
    })
    
    console.log("PDF created successfully:", result)
    return { success: true, message: result }
  } catch (error) {
    console.error("Error creating PDF:", error)
    return { success: false, message: error }
  }
}

export const getPdfs = async () => {
  try {
    const result = await prisma.pdf.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, result }
  } catch (error) {
    return { success: false, result: error }
  }
}

export const deletePdf = async (id: string) => {
  try {
    const result = await prisma.pdf.delete({
      where: { id }
    })
    return { success: true, message: result }
  } catch (error) {
    return { success: false, message: error }
  }
}



