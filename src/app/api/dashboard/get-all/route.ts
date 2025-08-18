import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.dashboard.count();
    
    // Get all dashboards with proper ordering
    // First priority: createdAt DESC (latest first)
    // Second priority: screenIndex ASC (1, 2, 3...) when creation time is the same
    const allDashboards = await prisma.dashboard.findMany({
      orderBy: [
        { createdAt: 'desc' },    // Primary: Order by creation time (latest first)
        { screenIndex: 'asc' }    // Secondary: Order by screen index (1, 2, 3...)
      ],
    });

    // Robust sorting to ensure proper screen order when creation time is the same
    // This handles all edge cases including null values and ensures screen 1 comes before screen 2
    allDashboards.sort((a, b) => {
      // First, compare by creation time (latest first)
      if (a.createdAt && b.createdAt) {
        const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
        // If time difference is more than 1 second, use time-based ordering
        if (Math.abs(timeDiff) > 1000) {
          return timeDiff;
        }
      }
      
      // If creation time is the same (within 1 second), order by screenIndex
      // Handle null values: null screenIndex goes last
      const aIndex = a.screenIndex !== null ? a.screenIndex : 999999;
      const bIndex = b.screenIndex !== null ? b.screenIndex : 999999;
      
      // Ensure ascending order: 1, 2, 3, 4...
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      
      // If screenIndex is the same, order by ID for consistency
      return a.id.localeCompare(b.id);
    });

    // Debug logging to see the actual ordering
    console.log('=== DASHBOARD ORDERING DEBUG ===');
    allDashboards.forEach((dashboard, index) => {
      console.log(`${index + 1}. ID: ${dashboard.id}, Created: ${dashboard.createdAt}, ScreenIndex: ${dashboard.screenIndex}, TotalScreens: ${dashboard.totalScreens}`);
    });
    console.log('=== END DEBUG ===');

    // Transform the data to match expected format
    const dashboardsWithDetails = allDashboards.map(dashboard => ({
      id: dashboard.id,
      aspectRatio: dashboard.aspectRatio,
      containers: dashboard.containers,
      createdAt: dashboard.createdAt,
      screenName: dashboard.screenName,
      screenIndex: dashboard.screenIndex,
      totalScreens: dashboard.totalScreens
    }));

    // Apply pagination
    const paginatedDashboards = dashboardsWithDetails.slice(skip, skip + limit);

    // Calculate pagination info
    const totalPages = Math.ceil(allDashboards.length / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      result: paginatedDashboards,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: allDashboards.length,
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