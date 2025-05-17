import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
    try {
        // Fetch all notices from the database with their relations
        const notices = await prisma.notice.findMany({
            include: {
                categoryRelation: true,
                container: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!notices || notices.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                message: "No notices found"
            });
        }

        return NextResponse.json({
            success: true,
            data: notices
        });
    } catch (error) {
        console.error("Error fetching notices:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: "Failed to fetch notices",
                error: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
} 