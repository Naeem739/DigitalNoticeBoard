import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function POST() {
  try {
    // Add default categories
    const defaultCategories = [
      { name: "General" },
      { name: "Announcements" },
      { name: "Events" },
      { name: "Important" },
      { name: "Updates" }
    ];

    const createdCategories = [];
    
    for (const category of defaultCategories) {
      try {
        const result = await prisma.category.create({
          data: category
        });
        createdCategories.push(result);
      } catch (error) {
        // Category might already exist, skip
        console.log(`Category ${category.name} might already exist`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Default categories created successfully",
      categories: createdCategories
    });
  } catch (error) {
    console.error("Error setting up categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to setup categories" },
      { status: 500 }
    );
  }
} 