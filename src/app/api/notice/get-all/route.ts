import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
    try {
        // Fetch all notices from the database
        const notices = await prisma.notice.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            data: notices
        });
    } catch (error) {
        console.error("Error fetching notices:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch notices" },
            { status: 500 }
        );
    }
} 