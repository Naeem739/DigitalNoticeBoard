'use server'
import { prisma } from "@/db/prisma"

export const createCategory = async(formData:Record<string,string>) =>{
    const name = formData.name.trim(); // Remove whitespace but don't force uppercase

    try{
        // Check if category already exists (case-insensitive)
        const existingCategory = await prisma.category.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive' // Case-insensitive search
                }
            }
        });

        if (existingCategory) {
            return {success: false, message: "Category already exists!"};
        }

        const result = await prisma.category.create({
            data:{
                name: name
            }
        })
        console.log(result,"_________________result");

        if(result){
            return {success:true, message: "Category is Created Successfully!"};
        }
        else{
            return {success:false, message: "Something went wrong!"};
        }

    }
    catch(error: any){
        console.error("Error creating category:", error);
        
        // Handle Prisma unique constraint error
        if (error.code === 'P2002') {
            return {success: false, message: "Category already exists!"};
        }
        
        return {success:false, message: "Failed to create category"};

    }
  
}

export const getCategories = async() =>{
    try{
        const result = await prisma.category.findMany({
            where: {
                name: {
                    not: "Image Widget" // Filter out Image Widget category
                }
            }
        });

        return {success:true, result}
    }
    catch(error){
        return {success:false, result:error};
    }
}

export const getCategoriesWithNotices = async() =>{
    try{
        const result = await prisma.category.findMany({
            where: {
                name: {
                    not: "Image Widget" // Filter out Image Widget category
                }
            },
            include:{
                notices:true
            }
        });

        return {success:true, result}
    }
    catch(error){
        return {success:false, result:error};
    }
}