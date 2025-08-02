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
        const result = await prisma.dashboard.findMany({
            orderBy:{
                createdAt:"desc"
            }
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