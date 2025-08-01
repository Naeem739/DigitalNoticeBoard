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
            },
            take:1
        });

        if (!result || result.length === 0) {
            return {
                success: true,
                result: {
                    notices: [],
                    id: '',
                    name: '',
                    noticeIds: []
                }
            };
        }

        const notices = await prisma.notice.findMany({
            where:{
                id:{
                    in: result[0].noticeIds || []
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

        return {
            success: true,
            result: {
                notices,
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