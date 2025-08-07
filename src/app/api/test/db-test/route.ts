import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test basic queries
    const categoryCount = await prisma.category.count();
    const noticeCount = await prisma.notice.count();
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        categoryCount,
        noticeCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 