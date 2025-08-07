import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function POST() {
  try {
    console.log("Creating sample dashboard...");
    
    // Create a sample dashboard
    const sampleDashboard = await prisma.dashboard.create({
      data: {
        aspectRatio: "16:9",
        containers: [
          {
            i: "widget-1",
            h: 4,
            w: 6,
            x: 0,
            y: 0,
            title: "Sample Notice Widget",
            id: "widget-1",
            category: "General",
            type: "notice",
            noticeIds: [],
            width: "50%",
            height: "200px"
          },
          {
            i: "widget-2", 
            h: 4,
            w: 6,
            x: 6,
            y: 0,
            title: "Sample Image Widget",
            id: "widget-2",
            type: "image",
            imageIds: [],
            width: "50%",
            height: "200px"
          }
        ]
      }
    });
    
    console.log("Sample dashboard created:", sampleDashboard);

    return NextResponse.json({
      success: true,
      message: "Sample dashboard created successfully",
      data: sampleDashboard
    });
  } catch (error) {
    console.error("Error creating sample dashboard:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to create sample dashboard",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
