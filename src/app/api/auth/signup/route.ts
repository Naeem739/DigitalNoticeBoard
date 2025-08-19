import { NextResponse } from "next/server"
// import prisma from "@/lib/prisma"
import { hash } from "bcrypt"
import { prisma } from "@/db/prisma"
import { UserRole } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json()
    const hashed_password = await hash(password, 12)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        {
          status: "error",
          message: "User with this email already exists",
        },
        { status: 400 }
      )
    }

    // Check if this is the first user in the system
    const userCount = await prisma.user.count()
    
    let userRole: UserRole = UserRole.USER
    if (userCount === 0) {
      // First user becomes SUPER_ADMIN
      userRole = UserRole.SUPER_ADMIN
    } else if (role) {
      // For subsequent users, use the provided role
      userRole = role === 'admin' ? UserRole.ADMIN : role === 'moderator' ? UserRole.MODERATOR : UserRole.USER
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed_password,
        role: userRole,
      },
    })

    // If created user is a moderator, initialize empty permission row for DX
    if (user.role === UserRole.MODERATOR) {
      try {
        await prisma.moderatorPermission.upsert({
          where: { moderatorId: user.id },
          create: { moderatorId: user.id, allowedRoutes: [] },
          update: {}
        })
      } catch {}
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: userCount === 0 
        ? 'Super Admin account created successfully! You are the first user of the system.'
        : role === 'admin' 
        ? 'Admin user created successfully' 
        : role === 'moderator' 
        ? 'Moderator user created successfully' 
        : 'User created successfully'
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
      },
      { status: 500 }
    )
  }
}

