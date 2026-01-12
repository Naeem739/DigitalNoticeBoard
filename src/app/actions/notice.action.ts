'use server'
import { prisma } from "@/db/prisma"
import { TNotice } from "@/types/types"
import { uploadPDF, uploadImage, deleteFileFromStorage, extractFilePathFromUrl, STORAGE_BUCKETS } from "@/lib/supabase"

export const createNotice = async(value: Omit<TNotice, "id"> & { pdfData?: string; imageData?: string })=>{
    try{
        console.log("Creating notice with data:", {
            title: value.title,
            category: value.category,
            categoryId: value.categoryId,
            hasContent: !!value.content,
            hasPdf: !!value.pdfData,
            hasImage: !!value.imageData
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

        // Handle PDF upload to Supabase Storage
        let pdfUrl = value.pdfUrl || undefined
        if (value.pdfData && value.pdfFileName && !pdfUrl) {
            try {
                const pdfBuffer = Buffer.from(value.pdfData, 'base64')
                const uploadResult = await uploadPDF(pdfBuffer, value.pdfFileName)
                if (uploadResult.error || !uploadResult.url) {
                    const errorMsg = uploadResult.error || 'Supabase upload returned no URL'
                    console.error("Error uploading PDF to Supabase:", errorMsg)
                    // If Supabase is not configured, we can't proceed - return error
                    if (errorMsg.includes('not configured')) {
                        return {success: false, message: `Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.`}
                    }
                    return {success: false, message: `Failed to upload PDF: ${errorMsg}`}
                }
                pdfUrl = uploadResult.url
                console.log("PDF uploaded to Supabase:", pdfUrl)
            } catch (error) {
                console.error("Error uploading PDF:", error)
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                return {success: false, message: `Failed to upload PDF: ${errorMessage}`}
            }
        }

        // Handle Image upload to Supabase Storage
        let imageUrl = value.imageUrl || undefined
        
        // If imageData is provided, always upload to Supabase Storage and use that URL
        // Only skip upload if imageUrl is already a valid Supabase Storage URL
        if (value.imageData && value.imageFileName) {
            const isSupabaseUrl = imageUrl && typeof imageUrl === 'string' && imageUrl.includes('supabase.co/storage')
            
            // Upload if no URL exists, URL is empty, URL is base64 data URL, or URL is not a Supabase URL
            if (!isSupabaseUrl) {
                try {
                    const imageBuffer = Buffer.from(value.imageData, 'base64')
                    const uploadResult = await uploadImage(imageBuffer, value.imageFileName)
                    if (uploadResult.error || !uploadResult.url) {
                        const errorMsg = uploadResult.error || 'Supabase upload returned no URL'
                        console.error("Error uploading image to Supabase:", errorMsg)
                        // If Supabase is not configured, we can't proceed - return error
                        if (errorMsg.includes('not configured')) {
                            return {success: false, message: `Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.`}
                        }
                        return {success: false, message: `Failed to upload image: ${errorMsg}`}
                    }
                    imageUrl = uploadResult.url
                    console.log("Image uploaded to Supabase:", imageUrl)
                } catch (error) {
                    console.error("Error uploading image:", error)
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    return {success: false, message: `Failed to upload image: ${errorMessage}`}
                }
            }
        }

        const result = await prisma.notice.create({
            data:{
                title : value.title,
                content: value.content ?? "",
                category : value.category,
                categoryId: value.categoryId,
                pdfUrl: pdfUrl,
                pdfFileName: value.pdfFileName,
                imageUrl: imageUrl,
                imageFileName: value.imageFileName
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
        // First, fetch all notices to get file URLs
        const notices = await prisma.notice.findMany({
            select: {
                id: true,
                pdfUrl: true,
                imageUrl: true
            }
        });

        // Delete all files from Supabase Storage
        for (const notice of notices) {
            // Delete PDF file if it exists
            if (notice.pdfUrl) {
                try {
                    const pdfFilePath = extractFilePathFromUrl(notice.pdfUrl, STORAGE_BUCKETS.PDFS);
                    if (pdfFilePath) {
                        await deleteFileFromStorage(STORAGE_BUCKETS.PDFS, pdfFilePath);
                    }
                } catch (error) {
                    console.error(`Error deleting PDF file for notice ${notice.id}:`, error);
                    // Continue with other deletions even if one fails
                }
            }

            // Delete image file if it exists
            if (notice.imageUrl) {
                try {
                    const imageFilePath = extractFilePathFromUrl(notice.imageUrl, STORAGE_BUCKETS.IMAGES);
                    if (imageFilePath) {
                        await deleteFileFromStorage(STORAGE_BUCKETS.IMAGES, imageFilePath);
                    }
                } catch (error) {
                    console.error(`Error deleting image file for notice ${notice.id}:`, error);
                    // Continue with other deletions even if one fails
                }
            }
        }

        // Delete all notices from database
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
        // First, fetch all notices in this category to get file URLs
        const notices = await prisma.notice.findMany({
            where: {
                category: categoryName
            },
            select: {
                id: true,
                pdfUrl: true,
                imageUrl: true
            }
        });

        // Delete all files from Supabase Storage
        for (const notice of notices) {
            // Delete PDF file if it exists
            if (notice.pdfUrl) {
                try {
                    const pdfFilePath = extractFilePathFromUrl(notice.pdfUrl, STORAGE_BUCKETS.PDFS);
                    if (pdfFilePath) {
                        await deleteFileFromStorage(STORAGE_BUCKETS.PDFS, pdfFilePath);
                    }
                } catch (error) {
                    console.error(`Error deleting PDF file for notice ${notice.id}:`, error);
                    // Continue with other deletions even if one fails
                }
            }

            // Delete image file if it exists
            if (notice.imageUrl) {
                try {
                    const imageFilePath = extractFilePathFromUrl(notice.imageUrl, STORAGE_BUCKETS.IMAGES);
                    if (imageFilePath) {
                        await deleteFileFromStorage(STORAGE_BUCKETS.IMAGES, imageFilePath);
                    }
                } catch (error) {
                    console.error(`Error deleting image file for notice ${notice.id}:`, error);
                    // Continue with other deletions even if one fails
                }
            }
        }

        // Delete notices from database
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