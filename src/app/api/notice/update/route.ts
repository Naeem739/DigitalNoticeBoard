import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();
        const { title, content, category, categoryId } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Notice ID is required" },
                { status: 400 }
            );
        }

        // Update the notice
        const updatedNotice = await prisma.notice.update({
            where: {
                id: id
            },
            data: {
                title: title,
                content: content,
                category: category,
                categoryId: categoryId
            }
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