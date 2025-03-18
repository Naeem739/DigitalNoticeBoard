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
        console.log(result);

      const notices = await prisma.notice.findMany({
        where:{
            id:{
                // @ts-expect-error hobe na
                in:result[0].noticeIds
            }
        }
    });

    console.log("notices", notices);
    console.log("result", result);

        return {
            success: true,
            result:{
                notices,
                ...result[0]
            }
        }

    }
    catch(err){
        return {
            success:false,
            result : err        }

    }
}