'use server'

import { prisma } from "@/db/prisma"

export type TImage = {
  id: string
  title: string
  imageUrl: string
  imageData: string
  fileName: string
  createdAt?: Date
}

export const createImage = async (value: Omit<TImage, "id">) => {
  try {
    console.log("Creating image with data:", {
      title: value.title,
      fileName: value.fileName,
      imageDataLength: value.imageData?.length || 0
    })
    
    const result = await prisma.image.create({
      data: {
        title: value.title,
        imageUrl: value.imageUrl,
        imageData: value.imageData,
        fileName: value.fileName,
      }
    })
    
    console.log("Image created successfully:", result)
    return { success: true, message: result }
  } catch (error) {
    console.error("Error creating image:", error)
    return { success: false, message: error }
  }
}

export const getImages = async () => {
  try {
    const result = await prisma.image.findMany({
      include: {
        container: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, result }
  } catch (error) {
    return { success: false, result: error }
  }
}

export const deleteImage = async (id: string) => {
  try {
    const result = await prisma.image.delete({
      where: { id }
    })
    return { success: true, message: result }
  } catch (error) {
    return { success: false, message: error }
  }
}

// Test function to check if database connection is working
export const testImageConnection = async () => {
  try {
    // Try to count images to test connection
    const count = await prisma.image.count()
    console.log("Database connection test - Image count:", count)
    return { success: true, count }
  } catch (error) {
    console.error("Database connection test failed:", error)
    return { success: false, error }
  }
} 