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
            editedName: true,
            categoryType: true
          }
        }
      }
    });

    // Transform the data to include category name and image data
    const noticesWithCategory = notices.map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      categoryId: notice.categoryId,
      pdfUrl: notice.pdfUrl,
      pdfFileName: notice.pdfFileName,
      pdfData: notice.pdfData,
      imageUrl: notice.imageUrl,
      imageFileName: notice.imageFileName,
      imageData: notice.imageData,
      categoryName: notice.categoryRelation?.editedName || notice.categoryRelation?.name || 'Uncategorized',
      categoryType: notice.categoryRelation?.categoryType || 'TEXT',
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