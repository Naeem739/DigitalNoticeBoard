'use server'

import { prisma } from "@/db/prisma"

export type TPdf = {
  id: string
  title: string
  pdfData: string
  fileName: string
  fileSize?: number
  createdAt?: Date
  updatedAt?: Date
}

export const createPdf = async (value: Omit<TPdf, "id" | "createdAt" | "updatedAt">) => {
  try {
    console.log("Creating PDF with data:", {
      title: value.title,
      fileName: value.fileName,
      pdfDataLength: value.pdfData?.length || 0
    })
    
    const result = await prisma.pdf.create({
      data: {
        title: value.title,
        pdfData: value.pdfData,
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



