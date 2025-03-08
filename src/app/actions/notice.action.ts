import { prisma } from "@/db/prisma"
import { TNotice } from "@/types/types"



export const createNotice = async(value: TNotice)=>{
    const result = await prisma.notice.create({
        data:{
           
            title : value.title,
            content: value.content,
            category : value.category,
            categoryId: value.categoryId 
          

        }
    })
    console.log(result);
}