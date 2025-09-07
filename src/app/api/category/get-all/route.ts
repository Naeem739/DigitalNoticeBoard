import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        notices: {
          select: {
            id: true
          }
        }
      }
    });

    // Transform the data to include notice count and filter out Image Widget category
    const categoriesWithCount = categories
      .filter(category => category.name !== "Image Widget") // Filter out Image Widget category
      .map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        editedName: category.editedName,
        categoryType: category.categoryType,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        noticeCount: category.notices.length
      }));

    return NextResponse.json({
      success: true,
      result: categoriesWithCount,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
} 