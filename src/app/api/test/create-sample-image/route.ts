import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function POST(request: NextRequest) {
  try {
    // Create a sample image with a small base64 data
    const sampleImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
    
    const sampleImage = await prisma.image.create({
      data: {
        title: 'Sample Test Image',
        imageUrl: sampleImageData,
        imageData: sampleImageData,
        fileName: 'sample-test-image.jpg',
      }
    })

    console.log('Sample image created:', sampleImage.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Sample image created successfully',
      image: {
        id: sampleImage.id,
        title: sampleImage.title,
        fileName: sampleImage.fileName
      }
    })

  } catch (error) {
    console.error('Error creating sample image:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create sample image' 
    }, { status: 500 })
  }
} 