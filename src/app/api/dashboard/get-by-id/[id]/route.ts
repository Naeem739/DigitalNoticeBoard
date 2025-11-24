import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET(
  request: Request,
  // { params }: { params: Promise<{ id: string }> }
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dashboardId } = await params;

    const dashboard = await prisma.dashboard.findUnique({
      where: {
        id: dashboardId
      }
    });

    if (!dashboard) {
      return NextResponse.json(
        { success: false, message: "Dashboard not found" },
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
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
} 