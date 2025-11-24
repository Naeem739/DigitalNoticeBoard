import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const id = context.params.id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin user not found'
        },
        { status: 404 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete admin user'
      },
      { status: 500 }
    );
  }
}