'use server'
import { prisma } from "@/db/prisma"
import { TNotice } from "@/types/types"

export const createNotice = async(value: Omit<TNotice, "id">)=>{
    try{
        console.log("Creating notice with data:", {
            title: value.title,
            category: value.category,
            categoryId: value.categoryId,
            hasContent: !!value.content,
            hasPdf: !!value.pdfData
        });

        // Test database connection first
        await prisma.$connect();
        console.log("Database connected successfully");

        // Check if category exists
        const categoryExists = await prisma.category.findUnique({
            where: { id: value.categoryId }
        });

        if (!categoryExists) {
            console.error("Category not found:", value.categoryId);
            return {success: false, message: "Category not found"};
        }

        console.log("Category found:", categoryExists);

        const result = await prisma.notice.create({
            data:{
                title : value.title,
                content: value.content as string,
                category : value.category,
                categoryId: value.categoryId,
                pdfUrl: value.pdfUrl,
                pdfFileName: value.pdfFileName,
                pdfData: value.pdfData,
                imageUrl: value.imageUrl,
                imageFileName: value.imageFileName,
                imageData: value.imageData
            }
        })
        
        console.log("Notice created successfully:", result);
        return {success:true, message:result};

    }
    catch(error){
        console.error("Error creating notice:", error);
        
        // More detailed error handling
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        
        return {success:false, message: error instanceof Error ? error.message : "Unknown error"};
    } finally {
        await prisma.$disconnect();
    }
   
}

// Delete all notices
export const deleteAllNotices = async() => {
    try{
        const result = await prisma.notice.deleteMany({});
        
        return {
            success: true,
            result: result
        }
    }
    catch(err){
        console.error("Error in deleteAllNotices:", err);
        return {
            success: false,
            result: err
        }
    }
}

// Delete notices by category
export const deleteNoticesByCategory = async(categoryName: string) => {
    try{
        const result = await prisma.notice.deleteMany({
            where: {
                category: categoryName
            }
        });
        
        return {
            success: true,
            result: result
        }
    }
    catch(err){
        console.error("Error in deleteNoticesByCategory:", err);
        return {
            success: false,
            result: err
        }
    }
}