import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { emitDashboardUpdate } from "@/lib/socket-server";

export async function PUT(
  request: Request,
  // { params }: { params: Promise<{ id: string }> }
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dashboardId } = await params;
    const body = await request.json();

    const { aspectRatio, containers } = body;

    const updatedDashboard = await prisma.dashboard.update({
      where: {
        id: dashboardId
      },
      data: {
        aspectRatio,
        containers
      }
    });

    // Emit Socket.io event for real-time update
    emitDashboardUpdate(updatedDashboard);

    return NextResponse.json({
      success: true,
      result: updatedDashboard,
      message: "Dashboard updated successfully"
    });
  } catch (error) {
    console.error("Error updating dashboard:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update dashboard" },
      { status: 500 }
    );
  }
} 