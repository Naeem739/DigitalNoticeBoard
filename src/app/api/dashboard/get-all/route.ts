import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
  try {
    const dashboards = await prisma.dashboard.findMany({
      orderBy: { createdAt: "desc" }
    });

    // Transform the data to match expected format
    const dashboardsWithDetails = dashboards.map(dashboard => ({
      id: dashboard.id,
      aspectRatio: dashboard.aspectRatio,
      containers: dashboard.containers,
      createdAt: dashboard.createdAt
    }));

    return NextResponse.json({
      success: true,
      result: dashboardsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching dashboards:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboards" },
      { status: 500 }
    );
  }
} 