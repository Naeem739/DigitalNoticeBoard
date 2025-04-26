import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

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

        // Delete the notice
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