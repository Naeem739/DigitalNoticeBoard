import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        categoryRelation: {
          select: {
            id: true,
            name: true,
            editedName: true
          }
        }
      }
    });

    // Transform the data to include category name
    const noticesWithCategory = notices.map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      categoryId: notice.categoryId,
      categoryName: notice.categoryRelation?.editedName || notice.categoryRelation?.name || 'Uncategorized',
      categoryRelation: notice.categoryRelation,
      createdAt: notice.createdAt
    }));

    return NextResponse.json({
      success: true,
      result: noticesWithCategory,
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notices" },
      { status: 500 }
    );
  }
} 