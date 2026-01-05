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
      where: { id: noticeId },
      include: {
        categoryRelation: {
          select: {
            name: true,
            editedName: true
          }
        }
      }
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
    const noticeContent = notice.content || 'No description available'
    
    // Get category name from relation or fallback
    const categoryName = notice.categoryRelation?.editedName || notice.categoryRelation?.name || notice.category || 'General'
    const escapedCategory = categoryName.replace(/[<>&'"]/g, (char) => {
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
    const createdDate = notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : 'Unknown'
    
    const noticeWithUpdatedAt = notice as typeof notice & { updatedAt: Date | null }
    const updatedDate = noticeWithUpdatedAt.updatedAt ? new Date(noticeWithUpdatedAt.updatedAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : createdDate
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapedTitle}</title>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Tiro Bangla', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 60px 80px;
            line-height: 1.6;
            color: #1e293b;
            background: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .content-wrapper {
            flex: 1;
          }
          
          .field {
            margin-bottom: 25px;
          }
          
          .info-box {
            background: #f1f5f9;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
            padding: 15px 20px;
            margin-bottom: 30px;
            display: inline-block;
          }
          
          .info-item {
            display: inline-block;
            margin-right: 30px;
          }
          
          .info-item:last-child {
            margin-right: 0;
          }
          
          .info-label {
            font-weight: 600;
            font-size: 13px;
            color: #64748b;
            margin-right: 8px;
          }
          
          .info-value {
            font-size: 13px;
            color: #0f172a;
            font-weight: 600;
          }
          
          .field-label {
            font-weight: 600;
            font-size: 16px;
            color: #475569;
            margin-bottom: 8px;
          }
          
          .field-value {
            font-size: 15px;
            color: #1e293b;
            line-height: 1.7;
            padding-left: 10px;
            border-left: 3px solid #3b82f6;
            background: #f8fafc;
            padding: 12px 15px;
            border-radius: 4px;
          }
          
          .title-field .field-value {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            border-left-color: #2563eb;
            border-left-width: 4px;
          }
          
          .description-field .field-value {
            min-height: 100px;
          }
          
          .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
          }
          
          .footer-content {
            font-size: 14px;
            color: #475569;
            line-height: 1.8;
          }
          
          .footer-title {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 5px;
          }
          
          .footer-dept {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 3px;
          }
          
          .footer-university {
            font-size: 14px;
            color: #64748b;
          }
          
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
          }
          
          .print-button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
            transform: translateY(-2px);
          }
          
          @media print {
            @page {
              margin: 0;
              size: auto;
            }
            
            body {
              padding: 40px;
              margin: 0;
            }
            
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print as PDF</button>
        
        <div class="content-wrapper">
          <div class="info-box">
            <div class="info-item">
              <span class="info-label">Category:</span>
              <span class="info-value">${escapedCategory}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Created:</span>
              <span class="info-value">${createdDate}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Updated:</span>
              <span class="info-value">${updatedDate}</span>
            </div>
          </div>
          
          <div class="field title-field">
            <div class="field-label">Title:</div>
            <div class="field-value">${escapedTitle}</div>
          </div>
          
          <div class="field description-field">
            <div class="field-label">Description:</div>
            <div class="field-value">${noticeContent}</div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="footer-title">Digital Notice Board</div>
            <div class="footer-dept">Department of Computer science and Engineering</div>
            <div class="footer-university">University of Barishal</div>
          </div>
        </div>
      </body>
      </html>
    `

    // For now, return HTML content that can be saved as a file
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