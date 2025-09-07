import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'PDF ID is required' 
      }, { status: 400 })
    }

    const pdf = await prisma.pdf.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true, 
      result: pdf 
    })

  } catch (error) {
    console.error('Error deleting PDF:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete PDF' 
    }, { status: 500 })
  }
}



