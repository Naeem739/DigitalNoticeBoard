/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

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

        // Update the notice
        const updateData: any = {
            title: title,
            category: category,
            categoryId: categoryId,
            imageData: imageData,
            imageFileName: imageFileName,
            imageUrl: imageUrl,
            pdfData: pdfData,
            pdfFileName: pdfFileName,
            pdfUrl: pdfUrl
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