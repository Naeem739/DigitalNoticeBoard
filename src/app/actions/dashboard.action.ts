/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { prisma } from "@/db/prisma"
import type { Prisma } from "@prisma/client"

/**
 * This interface should reflect the shape of your dashboard "container"
 * Adapt as needed for your exact schema.
 */
type DashboardContainer = {
  type?: string
  imageIds?: string[]
  noticeIds?: string[]
  [key: string]: unknown
}

// Create Dashboard
export const createDashboard = async (values: Prisma.DashboardCreateInput) => {
  try {
    const result = await prisma.dashboard.create({
      data: values
    });
    if (result.id) {
      // Real-time updates are handled by TanStack Query polling
      // No need for Socket.io emits
      return { success: true, result };
    } else {
      return { success: false, result: "Something went wrong" };
    }
  } catch (error) {
    return { success: false, result: error };
  }
};

// Get most recent dashboard and its notices/images
export const getDashboards = async () => {
  try {
    const result = await prisma.dashboard.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

        if (!result || result.length === 0) {
            return {
                success: true,
                result: {
                    notices: [],
                    images: [],
                    id: '',
                    name: '',
                    noticeIds: [],
                    imageIds: []
                }
            };
        }

    // Parse containers to identify widget types
    const containersRaw = Array.isArray(result[0].containers) ? result[0].containers : [];
    const containers: DashboardContainer[] = (containersRaw as unknown[])
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(item => item as DashboardContainer);
    const noticeIds: string[] = [];
    const imageIds: string[] = [];

    containers.forEach((container) => {
      // Defensive: ensure container is object
      if (typeof container !== 'object' || container == null) return;
      if (container.type === "image" && Array.isArray(container.imageIds)) {
        imageIds.push(...container.imageIds.filter(id => typeof id === "string"));
      }
      if (Array.isArray(container.noticeIds)) {
        noticeIds.push(...container.noticeIds.filter(id => typeof id === "string"));
      }
    });

    // Fetch notices
    const notices = await prisma.notice.findMany({
      where: {
        id: {
          in: noticeIds
        }
      },
      include: {
        categoryRelation: true,
        container: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Note: Removed image fetching since Image model doesn't exist in schema
    // If you need images, add the Image model to your Prisma schema first

    return {
      success: true,
      result: {
        notices,
        images: [], // Return empty array for now
        ...result[0]
      }
    }
  } catch (err) {
    console.error("Error in getDashboards:", err);
    return {
      success: false,
      result: err
    }
  }
}

// Get all dashboard records for pagination
export const getAllDashboards = async () => {
  try {
    const result = await prisma.dashboard.findMany({
      orderBy: [
        { createdAt: 'desc' },
        { screenIndex: 'asc' }
      ]
    });

    // Additional sorting to ensure proper screen order when creation time is the same
    result.sort((a, b) => {
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
      const aIndex = a.screenIndex !== null && a.screenIndex !== undefined ? a.screenIndex : 999999;
      const bIndex = b.screenIndex !== null && b.screenIndex !== undefined ? b.screenIndex : 999999;

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      // If screenIndex is the same, order by ID for consistency
      return a.id.localeCompare(b.id);
    });

    return {
      success: true,
      result: result
    }
  } catch (err) {
    console.error("Error in getAllDashboards:", err);
    return {
      success: false,
      result: err
    }
  }
}

// Delete dashboard by ID
export const deleteDashboard = async (id: string) => {
  try {
    const result = await prisma.dashboard.delete({
      where: { id }
    });

    return {
      success: true,
      result: result
    }
  } catch (err) {
    console.error("Error in deleteDashboard:", err);
    return {
      success: false,
      result: err
    }
  }
}

// Delete all dashboards
export const deleteAllDashboards = async () => {
  try {
    const result = await prisma.dashboard.deleteMany({});

    return {
      success: true,
      result: result
    }
  } catch (err) {
    console.error("Error in deleteAllDashboards:", err);
    return {
      success: false,
      result: err
    }
  }
}

// Get specific dashboard by index
export const getDashboardByIndex = async (index: number) => {
  try {
    const result = await prisma.dashboard.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

        if (!result || result.length === 0) {
            return {
                success: true,
                result: {
                    notices: [],
                    images: [],
                    id: '',
                    name: '',
                    noticeIds: [],
                    imageIds: []
                }
            };
        }

        // Get dashboard at specific index
        const dashboard = result[index];
        if (!dashboard) {
            return {
                success: true,
                result: {
                    notices: [],
                    images: [],
                    id: '',
                    name: '',
                    noticeIds: [],
                    imageIds: []
                }
            };
        }

        // Parse containers to identify widget types
        const containers = dashboard.containers || [];
        const noticeIds: string[] = [];
        const imageIds: string[] = [];

        // Extract notice and image IDs from containers
        if (Array.isArray(containers)) {
            containers.forEach((container: any) => {
                if (container && typeof container === "object") {
                    if (container.type === "image" && Array.isArray(container.imageIds)) {
                        imageIds.push(...container.imageIds);
                    } 
                    if (Array.isArray(container.noticeIds)) {
                        noticeIds.push(...container.noticeIds);
                    }
                }
            });
        }

        // Fetch notices
        const notices = await prisma.notice.findMany({
            where:{
                id:{
                    in: noticeIds
                }
            },
            include: {
                categoryRelation: true,
                container: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Image model doesn't exist, so we skip image fetching

        return {
            success: true,
            result: {
                notices,
                images: [], // Return empty array
                ...dashboard
            }
        }
    }
    catch(err){
        console.error("Error in getDashboardByIndex:", err);
        return {
            success: false,
            result: err
        }
    }
}

// TempDashboard Actions
export const createTempDashboard = async(values: any) => {
    try{
        // Check if tempDashboard model is available in Prisma client
        if (!(prisma as any).tempDashboard) {
            console.warn("Prisma client has no tempDashboard model. Did you run prisma generate?")
            return { success: false, result: "TempDashboard model not available" }
        }
        
        const result = await (prisma as any).tempDashboard.create({
            data: values
        })
        if(result.id){
            return {success: true, result}
        }
        else {
            return { success: false, result: "Something went wrong"}
        }
    }
    catch(error){
        return {success: false, result: error}
    }
}

export const updateTempDashboard = async(id: string, values: any) => {
    try{
        // Check if tempDashboard model is available in Prisma client
        if (!(prisma as any).tempDashboard) {
            console.warn("Prisma client has no tempDashboard model. Did you run prisma generate?")
            return { success: false, result: "TempDashboard model not available" }
        }
        
        const result = await (prisma as any).tempDashboard.update({
            where: { id },
            data: values
        })
        if(result.id){
            return {success: true, result}
        }
        else {
            return { success: false, result: "Something went wrong"}
        }
    }
    catch(error){
        return {success: false, result: error}
    }
}

export const deleteTempDashboard = async(id: string) => {
    try{
        // Check if tempDashboard model is available in Prisma client
        if (!(prisma as any).tempDashboard) {
            console.warn("Prisma client has no tempDashboard model. Did you run prisma generate?")
            return { success: false, result: "TempDashboard model not available" }
        }
        
        const result = await (prisma as any).tempDashboard.delete({
            where: { id }
        });
        
        return {
            success: true,
            result: result
        }
    }
    catch(err){
        console.error("Error in deleteTempDashboard:", err);
        return {
            success: false,
            result: err
        }
    }
}

export const deleteAllTempDashboards = async() => {
    try{
        // In some environments the Prisma client might be outdated and not include TempDashboard yet.
        // Gracefully handle that by short-circuiting when the model is missing.
         
        const tempModel = (prisma as any).tempDashboard
        if (!tempModel) {
            console.warn("Prisma client has no tempDashboard model. Skipping deleteAllTempDashboards(). Did you run prisma generate?")
            return {
                success: true,
                result: { count: 0 }
            }
        }
        const result = await tempModel.deleteMany({});
        
        return {
            success: true,
            result: result
        }
    }
    catch(err){
        console.error("Error in deleteAllTempDashboards:", err);
        return {
            success: false,
            result: err
        }
    }
}

export const getAllTempDashboards = async() => {
    try{
        // Check if tempDashboard model is available in Prisma client
        if (!(prisma as any).tempDashboard) {
            console.warn("Prisma client has no tempDashboard model. Did you run prisma generate?")
            return { success: false, result: "TempDashboard model not available" }
        }
        
        const result = await (prisma as any).tempDashboard.findMany({
            orderBy: [
                { createdAt: 'desc' },
                { screenIndex: 'asc' }
            ]
        });

        return {
            success: true,
            result: result
        }
    }
    catch(err){
        console.error("Error in getAllTempDashboards:", err);
        return {
            success: false,
            result: err
        }
    }
}

export const getTempDashboardScreens = async(id: string) => {
    try {
        // Check if tempDashboard model is available in Prisma client
        if (!(prisma as any).tempDashboard) {
            console.warn("Prisma client has no tempDashboard model. Did you run prisma generate?")
            return { success: false, error: "TempDashboard model not available" }
        }
        
        // First, get the temp dashboard with the provided ID to get its creation time
        const originalTempDashboard = await (prisma as any).tempDashboard.findUnique({
            where: { id }
        })

        if (!originalTempDashboard) {
            return {
                success: false,
                error: "TempDashboard not found"
            }
        }

        // Get all temp dashboards created within 1 second of the original temp dashboard
        const oneSecondLater = new Date(originalTempDashboard.createdAt!.getTime() + 1000)
        const oneSecondEarlier = new Date(originalTempDashboard.createdAt!.getTime() - 1000)

        const allScreens = await (prisma as any).tempDashboard.findMany({
            where: {
                createdAt: {
                    gte: oneSecondEarlier,
                    lte: oneSecondLater
                }
            },
            orderBy: {
                screenIndex: 'asc'
            }
        })

        return {
            success: true,
            result: allScreens
        }
    } catch (error) {
        console.error("Error getting temp dashboard screens:", error)
        return {
            success: false,
            error: "Failed to get temp dashboard screens"
        }
    }
}