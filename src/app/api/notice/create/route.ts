import { NextRequest, NextResponse } from "next/server";
import { createNotice } from "@/app/actions/notice.action";
type CreateNoticePayload = {
  title: string;
  content?: string;
  category: string;
  categoryId: string;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfData?: string;
  imageUrl?: string;
  imageFileName?: string;
  imageData?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateNoticePayload>;

    const {
      title,
      content,
      category,
      categoryId,
      pdfData,
      pdfFileName,
      pdfUrl,
      imageData,
      imageFileName,
      imageUrl,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 }
      );
    }

    if (!category || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Category and categoryId are required" },
        { status: 400 }
      );
    }

    const payload = {
      title: title.trim(),
      content: content ?? "",
      category,
      categoryId,

      // PDF fields
      pdfUrl,
      pdfFileName,
      pdfData,

      // Image fields
      imageUrl,
      imageFileName,
      imageData
    };

    // Call existing server-side logic
    const result = await createNotice(payload as any as {
      title: string;
      content?: string;
      category: string;
      categoryId: string;
      pdfUrl?: string;
      pdfFileName?: string;
      pdfData?: string;
      imageData?: string;
      imageUrl?: string;
      imageFileName?: string;
    });

    const status = result.success ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("Error in /api/notice/create:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create notice";

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

