import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get categoryId from query parameters if provided
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');

    // Build where clause - filter by categoryId if provided
    const whereClause = categoryId ? { categoryId } : {};

    const notices = await prisma.notice.findMany({
      where: whereClause,
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
      imageUrl: notice.imageUrl,
      imageFileName: notice.imageFileName,
      categoryName: notice.categoryRelation?.editedName || notice.categoryRelation?.name || 'Uncategorized',
      categoryType: notice.categoryRelation?.categoryType || 'TEXT',
      categoryRelation: notice.categoryRelation,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt
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