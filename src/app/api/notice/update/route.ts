/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { uploadPDF, uploadImage } from "@/lib/supabase";

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();
        const { title, content, category, categoryId, imageData, imageFileName, imageUrl, pdfData, pdfFileName, pdfUrl } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Notice ID is required" },
                { status: 400 }
            );
        }

        // Handle PDF upload to Supabase Storage
        let finalPdfUrl = pdfUrl || undefined
        const isPdfBase64DataUrl = finalPdfUrl && finalPdfUrl.startsWith('data:application/pdf')
        
        if (pdfData && pdfFileName && (!finalPdfUrl || isPdfBase64DataUrl)) {
            try {
                const pdfBuffer = Buffer.from(pdfData, 'base64')
                const uploadResult = await uploadPDF(pdfBuffer, pdfFileName)
                if (uploadResult.error || !uploadResult.url) {
                    const errorMsg = uploadResult.error || 'Supabase upload returned no URL'
                    console.error("Error uploading PDF to Supabase:", errorMsg)
                    return NextResponse.json(
                        { success: false, message: `Failed to upload PDF: ${errorMsg}` },
                        { status: 500 }
                    )
                }
                finalPdfUrl = uploadResult.url
                console.log("PDF uploaded to Supabase:", finalPdfUrl)
            } catch (error) {
                console.error("Error uploading PDF:", error)
                return NextResponse.json(
                    { success: false, message: `Failed to upload PDF: ${error instanceof Error ? error.message : 'Unknown error'}` },
                    { status: 500 }
                )
            }
        }

        // Handle Image upload to Supabase Storage
        let finalImageUrl = imageUrl || undefined
        
        // If imageData is provided, always upload to Supabase Storage and use that URL
        // Only skip upload if imageUrl is already a valid Supabase Storage URL
        if (imageData && imageFileName) {
            const isSupabaseUrl = finalImageUrl && typeof finalImageUrl === 'string' && finalImageUrl.includes('supabase.co/storage')
            
            // Upload if no URL exists, URL is empty, URL is base64 data URL, or URL is not a Supabase URL
            if (!isSupabaseUrl) {
                try {
                    const imageBuffer = Buffer.from(imageData, 'base64')
                    const uploadResult = await uploadImage(imageBuffer, imageFileName)
                    if (uploadResult.error || !uploadResult.url) {
                        const errorMsg = uploadResult.error || 'Supabase upload returned no URL'
                        console.error("Error uploading image to Supabase:", errorMsg)
                        return NextResponse.json(
                            { success: false, message: `Failed to upload image: ${errorMsg}` },
                            { status: 500 }
                        )
                    }
                    finalImageUrl = uploadResult.url
                    console.log("Image uploaded to Supabase:", finalImageUrl)
                } catch (error) {
                    console.error("Error uploading image:", error)
                    return NextResponse.json(
                        { success: false, message: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}` },
                        { status: 500 }
                    )
                }
            }
        }

        // Update the notice - don't store imageData or pdfData, only URLs
        const updateData: any = {
            title: title,
            category: category,
            categoryId: categoryId,
            imageFileName: imageFileName,
            imageUrl: finalImageUrl,
            pdfFileName: pdfFileName,
            pdfUrl: finalPdfUrl
        };

        // Only include content if it's provided
        if (content !== undefined) {
            updateData.content = content;
        }

        const updatedNotice = await prisma.notice.update({
            where: {
                id: id
            },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            message: "Notice updated successfully",
            data: updatedNotice
        });
    } catch (error) {
        console.error("Error updating notice:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update notice" },
            { status: 500 }
        );
    }
} 