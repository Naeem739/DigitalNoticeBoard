import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
  try {
    // Get the most recent dashboard
    const dashboard = await prisma.dashboard.findFirst({
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!dashboard) {
      return NextResponse.json(
        { success: false, message: "No dashboard found" },
        { status: 404 }
      );
    }

    // Transform the data to match expected format
    const dashboardWithDetails = {
      id: dashboard.id,
      aspectRatio: dashboard.aspectRatio,
      containers: dashboard.containers,
      createdAt: dashboard.createdAt
    };

    return NextResponse.json({
      success: true,
      result: dashboardWithDetails,
    });
  } catch (error) {
    console.error("Error fetching default dashboard:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch default dashboard" },
      { status: 500 }
    );
  }
}
