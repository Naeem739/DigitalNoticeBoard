'use server'
import { prisma } from "@/db/prisma"
import { TNotice } from "@/types/types"



export const createNotice = async(value: TNotice)=>{
    try{
        const result = await prisma.notice.create({
            data:{
               
                title : value.title,
                content: value.content,
                category : value.category,
                categoryId: value.categoryId 
              
    
            }
        })
        return {success:true, message:result};

    }
    catch(error){
        return {success:true, message:error};


    }
   
}