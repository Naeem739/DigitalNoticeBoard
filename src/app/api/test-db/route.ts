import { NextResponse } from "next/server"
import { prisma as db } from "@/db/prisma"

export async function GET() {
  try {
    console.log("Testing database connection...")
    
    // Test basic connection
    await db.$connect()
    console.log("Database connected successfully")
    
    // Test if PublicNoticeSettings table exists
    const settingsCount = await db.publicNoticeSettings.count()
    console.log("PublicNoticeSettings table exists, count:", settingsCount)
    
    // Test if we can create a record
    const testSettings = await db.publicNoticeSettings.create({
      data: {
        title: "Test Settings",
        subtitle: "Test Department",
        emergencyNumber: "1234567890",
        emergencyContact: "Test Contact",
        departmentName: "Test Department",
        backgroundType: "gradient",
        headerBackgroundColor: "#1e293b",
        footerBackgroundColor: "#1e293b",
        accentColor: "#3b82f6"
      }
    })
    console.log("Test record created:", testSettings.id)
    
    // Clean up - delete the test record
    await db.publicNoticeSettings.delete({
      where: { id: testSettings.id }
    })
    console.log("Test record deleted")
    
    await db.$disconnect()
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection and PublicNoticeSettings table working correctly",
      settingsCount
    })
  } catch (error) {
    console.error("Database test failed:", error)
    await db.$disconnect()
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Database test failed" 
      },
      { status: 500 }
    )
  }
} 