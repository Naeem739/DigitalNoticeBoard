import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { getToken } from 'next-auth/jwt'

export async function PATCH(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin via JWT token
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || ((token as any).role !== 'ADMIN' && (token as any).role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { success: false, message: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['USER', 'MODERATOR', 'ADMIN']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update user role' },
      { status: 500 }
    )
  }
}
