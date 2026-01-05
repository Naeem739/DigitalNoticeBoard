import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(
  request: NextRequest,
  // { params }: { params: Promise<{ id: string }> }
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noticeId } = await params

    // Fetch the notice from database
    const notice = await prisma.notice.findUnique({
      where: { id: noticeId }
    })

    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }

    // If it's a PDF notice, return the PDF data
    if (notice.pdfData) {
      const pdfBuffer = Buffer.from(notice.pdfData, 'base64')
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${notice.pdfFileName || notice.title}.pdf"`,
        },
      })
    }

    // For text notices, generate a simple HTML that can be converted to PDF
    // In a production environment, you'd want to use a proper PDF generation library
    

    
    // Escape title and category to prevent XSS (these are plain text fields)
    const escapedTitle = notice.title.replace(/[<>&'"]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&#39;',
        '"': '&quot;'
      }
      return entities[char]
    })
    
    // Content is already HTML from the rich text editor, so render it directly
    const noticeContent = notice.content || 'No content available'
    
    const escapedCategory = (notice.category || 'General').replace(/[<>&'"]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&#39;',
        '"': '&quot;'
      }
      return entities[char]
    })
    
    // Safely format the creation and update dates
    const createdDate = notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Unknown'
    // Type assertion needed until TypeScript picks up the updated schema
    const noticeWithUpdatedAt = notice as typeof notice & { updatedAt: Date | null }
    const updatedDate = noticeWithUpdatedAt.updatedAt ? new Date(noticeWithUpdatedAt.updatedAt).toLocaleDateString() : (notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Unknown')
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapedTitle}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
          }
          h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          .content {
            margin-top: 20px;
            font-size: 16px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            font-size: 12px;
            color: #7f8c8d;
            text-align: center;
          }
          .notice-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #3498db;
          }
          .category {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .print-button:hover {
            background-color: #2980b9;
          }
          @media print {
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print as PDF</button>
        <div class="notice-info">
          <div class="category">${escapedCategory}</div>
          <div><strong>Created:</strong> ${createdDate}</div>
          <div><strong>Last Updated:</strong> ${updatedDate}</div>
        </div>
        
        <h1>${escapedTitle}</h1>
        
        <div class="content">
          ${noticeContent}
        </div>
        
        <div class="footer">
          <strong>Digital Notice Board</strong><br>
          Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
          Notice ID: ${notice.id}
        </div>
      </body>
      </html>
    `

    // For now, return HTML content that can be saved as a file
    // In a real implementation, you'd convert this to PDF using a library like puppeteer or jsPDF
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('Error generating notice download:', error)
    return NextResponse.json({ 
      error: 'Failed to generate download',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 