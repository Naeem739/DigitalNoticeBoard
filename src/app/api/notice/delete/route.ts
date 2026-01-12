import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { deleteFileFromStorage, extractFilePathFromUrl, STORAGE_BUCKETS } from "@/lib/supabase";

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Notice ID is required" },
                { status: 400 }
            );
        }

        // First, fetch the notice to get file URLs
        const notice = await prisma.notice.findUnique({
            where: { id }
        });

        if (!notice) {
            return NextResponse.json(
                { success: false, message: "Notice not found" },
                { status: 404 }
            );
        }

        // Delete PDF file from Supabase Storage if it exists
        if (notice.pdfUrl) {
            try {
                const pdfFilePath = extractFilePathFromUrl(notice.pdfUrl, STORAGE_BUCKETS.PDFS);
                if (pdfFilePath) {
                    const deleteResult = await deleteFileFromStorage(STORAGE_BUCKETS.PDFS, pdfFilePath);
                    if (!deleteResult.success) {
                        console.warn(`Failed to delete PDF file from storage: ${deleteResult.error}`);
                        // Continue with database deletion even if storage deletion fails
                    }
                }
            } catch (error) {
                console.error("Error deleting PDF file from storage:", error);
                // Continue with database deletion even if storage deletion fails
            }
        }

        // Delete image file from Supabase Storage if it exists
        if (notice.imageUrl) {
            try {
                const imageFilePath = extractFilePathFromUrl(notice.imageUrl, STORAGE_BUCKETS.IMAGES);
                if (imageFilePath) {
                    const deleteResult = await deleteFileFromStorage(STORAGE_BUCKETS.IMAGES, imageFilePath);
                    if (!deleteResult.success) {
                        console.warn(`Failed to delete image file from storage: ${deleteResult.error}`);
                        // Continue with database deletion even if storage deletion fails
                    }
                }
            } catch (error) {
                console.error("Error deleting image file from storage:", error);
                // Continue with database deletion even if storage deletion fails
            }
        }

        // Delete the notice from database
        const deletedNotice = await prisma.notice.delete({
            where: {
                id: id
            }
        });

        return NextResponse.json({
            success: true,
            message: "Notice deleted successfully",
            data: deletedNotice
        });
    } catch (error) {
        console.error("Error deleting notice:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete notice" },
            { status: 500 }
        );
    }
} 