'use server'
import { prisma } from "@/db/prisma"

export const createCategory = async(formData:Record<string,string>) =>{
    const name = formData.name.trim(); // Remove whitespace but don't force uppercase
    const categoryType = formData.categoryType || 'TEXT'; // Default to TEXT if not provided

    try{
        // Check if category with same name AND type already exists (case-insensitive)
        const existingCategory = await prisma.category.findFirst({
            where: {
                AND: [
                    {
                        name: {
                            equals: name,
                            mode: 'insensitive' // Case-insensitive search
                        }
                    },
                    {
                        categoryType: categoryType as 'TEXT' | 'IMAGE' | 'PDF'
                    }
                ]
            }
        });

        if (existingCategory) {
            return {success: false, message: `A category with the name "${name}" and type "${categoryType}" already exists. Please choose a different name or type.`};
        }

        const result = await prisma.category.create({
            data:{
                name: name,
                categoryType: categoryType as 'TEXT' | 'IMAGE' | 'PDF'
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
            return {success: false, message: `A category with the name "${name}" and type "${categoryType}" already exists. Please choose a different name or type.`};
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

export const getDashboardCategory = async() => {
    try{
        const result = await prisma.category.findFirst({
            where: {
                AND: [
                    {
                        name: {
                            equals: "Dashboard",
                            mode: 'insensitive'
                        }
                    },
                    {
                        categoryType: 'IMAGE'
                    }
                ]
            }
        });

        return {success: true, result}
    }
    catch(error){
        return {success: false, result: error};
    }
}

export const getDashboardPdfCategory = async() => {
    try{
        const result = await prisma.category.findFirst({
            where: {
                AND: [
                    {
                        name: {
                            equals: "Dashboard",
                            mode: 'insensitive'
                        }
                    },
                    {
                        categoryType: 'PDF'
                    }
                ]
            }
        });

        return {success: true, result}
    }
    catch(error){
        return {success: false, result: error};
    }
}

export const getTextCategoriesWithNotices = async() =>{
    try{
        const result = await prisma.category.findMany({
            where: {
                AND: [
                    {
                        name: {
                            not: "Image Widget" // Filter out Image Widget category
                        }
                    },
                    {
                        categoryType: 'TEXT' // Only get TEXT type categories
                    }
                ]
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