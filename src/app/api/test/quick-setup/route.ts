import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function POST() {
  try {
    console.log("Starting quick setup...");
    
    // Test database connection
    await prisma.$connect();
    console.log("Database connected successfully");
    
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
        console.log(`Created category: ${category.name}`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`Category ${category.name} already exists`);
        } else {
          console.error(`Error creating category ${category.name}:`, error);
        }
      }
    }

    // Get all categories
    const allCategories = await prisma.category.findMany();
    console.log("All categories:", allCategories);

    // Test notice creation
    if (allCategories.length > 0) {
      const testNotice = await prisma.notice.create({
        data: {
          title: "Test Notice",
          content: "This is a test notice",
          category: allCategories[0].name,
          categoryId: allCategories[0].id
        }
      });
      console.log("Test notice created:", testNotice);
      
      // Clean up test notice
      await prisma.notice.delete({
        where: { id: testNotice.id }
      });
      console.log("Test notice cleaned up");
    }

    return NextResponse.json({
      success: true,
      message: "Quick setup completed successfully",
      data: {
        categoriesCreated: createdCategories.length,
        totalCategories: allCategories.length,
        databaseConnected: true
      }
    });
  } catch (error) {
    console.error("Quick setup error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Quick setup failed",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 