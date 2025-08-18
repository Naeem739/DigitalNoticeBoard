'use server'

import { prisma } from "@/db/prisma"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createDashboard = async(values:any) => {
    try{
        const result = await prisma.dashboard.create({
            data:values
        })
        if(result.id){
            return {success:true, result}
        }
        else {
            return { success:false, result:"Something went wrong"}
        }
    }
    catch(error){
        return {success: false, result: error}
    }
}

export const getDashboards = async() => {
    try{
        const result = await prisma.dashboard.findMany({
            orderBy:{
                createdAt:"desc"
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
        const containers = result[0].containers || [];
        const noticeIds: string[] = [];
        const imageIds: string[] = [];

        // Extract notice and image IDs from containers
        containers.forEach((container: any) => {
            if (container.type === "image" && container.imageIds) {
                imageIds.push(...container.imageIds);
            } else if (container.noticeIds) {
                noticeIds.push(...container.noticeIds);
            }
        });

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

        // Fetch images
        const images = await prisma.image.findMany({
            where:{
                id:{
                    in: imageIds
                }
            },
            include: {
                container: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return {
            success: true,
            result: {
                notices,
                images,
                ...result[0]
            }
        }
    }
    catch(err){
        console.error("Error in getDashboards:", err);
        return {
            success: false,
            result: err
        }
    }
}

// Get all dashboard records for pagination
export const getAllDashboards = async() => {
    try{
        // Get all dashboards with proper ordering
        // First priority: createdAt DESC (latest first)
        // Second priority: screenIndex ASC (1, 2, 3...) when creation time is the same
        const result = await prisma.dashboard.findMany({
            orderBy: [
                { createdAt: 'desc' },    // Primary: Order by creation time (latest first)
                { screenIndex: 'asc' }    // Secondary: Order by screen index (1, 2, 3...)
            ]
        });

        // Additional sorting to ensure proper screen order when creation time is the same
        // This handles cases where Prisma might not handle null values correctly
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
            const aIndex = a.screenIndex !== null ? a.screenIndex : 999999;
            const bIndex = b.screenIndex !== null ? b.screenIndex : 999999;
            
            // Ensure ascending order: 1, 2, 3, 4...
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
    }
    catch(err){
        console.error("Error in getAllDashboards:", err);
        return {
            success: false,
            result: err
        }
    }
}

// Delete dashboard by ID
export const deleteDashboard = async(id: string) => {
    try{
        const result = await prisma.dashboard.delete({
            where: { id }
        });
        
        return {
            success: true,
            result: result
        }
    }
    catch(err){
        console.error("Error in deleteDashboard:", err);
        return {
            success: false,
            result: err
        }
    }
}

// Get specific dashboard by index
export const getDashboardByIndex = async(index: number) => {
    try{
        const result = await prisma.dashboard.findMany({
            orderBy:{
                createdAt:"desc"
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
        containers.forEach((container: any) => {
            if (container.type === "image" && container.imageIds) {
                imageIds.push(...container.imageIds);
            } else if (container.noticeIds) {
                noticeIds.push(...container.noticeIds);
            }
        });

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

        // Remove image fetching from prisma.image
        // const images = await prisma.image.findMany({ ... });

        return {
            success: true,
            result: {
                notices,
                // images: [], // Optionally return an empty array if frontend expects it
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