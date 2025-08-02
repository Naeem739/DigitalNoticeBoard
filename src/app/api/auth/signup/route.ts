import { NextResponse } from "next/server"
// import prisma from "@/lib/prisma"
import { hash } from "bcrypt"
import { prisma } from "@/db/prisma"

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

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed_password,
      },
    })
    console.log("user    ", user);

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: role || 'user'
      },
      message: role === 'admin' ? 'Admin user created successfully' : 'User created successfully'
    })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

