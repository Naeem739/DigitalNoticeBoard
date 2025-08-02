import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
  try {
    const images = await prisma.image.findMany({
      orderBy: { createdAt: "desc" }
    });

    // Transform the data to match expected format
    const imagesWithDetails = images.map(image => ({
      id: image.id,
      title: image.title,
      fileName: image.fileName,
      imageUrl: image.imageUrl,
      createdAt: image.createdAt
    }));

    return NextResponse.json({
      success: true,
      result: imagesWithDetails,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch images" },
      { status: 500 }
    );
  }
} 