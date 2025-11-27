import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function DELETE(
  request: NextRequest,
  // { params }: { params: { id: string } }
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category not found'
        },
        { status: 404 }
      )
    }

    // Delete the category
    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete category'
      },
      { status: 500 }
    )
  }
} 