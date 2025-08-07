import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.dashboard.count();
    
    // Fetch dashboards with pagination
    const dashboards = await prisma.dashboard.findMany({
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    // Transform the data to match expected format
    const dashboardsWithDetails = dashboards.map(dashboard => ({
      id: dashboard.id,
      aspectRatio: dashboard.aspectRatio,
      containers: dashboard.containers,
      createdAt: dashboard.createdAt
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      result: dashboardsWithDetails,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      }
    });
  } catch (error) {
    console.error("Error fetching dashboards:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboards" },
      { status: 500 }
    );
  }
} 