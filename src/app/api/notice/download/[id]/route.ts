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
          * {
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #1f2933;
            background-color: #f9fafb;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 32px 36px;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
            border: 1px solid #e5e7eb;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #2563eb;
            color: #ffffff;
            border: none;
            padding: 10px 20px;
            border-radius: 999px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
          }
          .print-button:hover {
            background-color: #1d4ed8;
          }
          @media print {
            body {
              margin: 0;
              background: #ffffff;
            }
            .container {
              box-shadow: none;
              border: none;
              margin: 0;
              border-radius: 0;
            }
            .print-button {
              display: none;
            }
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #e5e7eb;
          }
          .meta-section,
          .content-section {
            margin-bottom: 28px;
          }
          .field-row {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .field-label {
            width: 140px;
            font-weight: 600;
            color: #374151;
          }
          .field-value {
            flex: 1;
            color: #111827;
          }
          .category-badge {
            display: inline-block;
            padding: 4px 14px;
            border-radius: 999px;
            background-color: #e0f2fe;
            color: #1d4ed8;
            font-size: 13px;
            font-weight: 600;
          }
          .title-value {
            font-size: 20px;
            font-weight: 700;
          }
          .description-content {
            margin-top: 4px;
            font-size: 15px;
            line-height: 1.7;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #4b5563;
            text-align: center;
          }
          .footer-line-strong {
            font-weight: 700;
            color: #111827;
          }
          .footer-line {
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print / Save as PDF</button>
        <div class="container">
          <div class="meta-section">
            <div class="section-title">Notice Information</div>
            <div class="field-row">
              <div class="field-label">Category:</div>
              <div class="field-value">
                <span class="category-badge">${escapedCategory}</span>
              </div>
            </div>
            <div class="field-row">
              <div class="field-label">Created at:</div>
              <div class="field-value">${createdDate}</div>
            </div>
            <div class="field-row">
              <div class="field-label">Last Updated at:</div>
              <div class="field-value">${updatedDate}</div>
            </div>
          </div>

          <div class="content-section">
            <div class="section-title">Notice Content</div>
            <div class="field-row">
              <div class="field-label">Title:</div>
              <div class="field-value title-value">${escapedTitle}</div>
            </div>
            <div class="field-row">
              <div class="field-label">Description:</div>
              <div class="field-value">
                <div class="description-content">
                  ${noticeContent}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-line-strong">Digital Notice Board</div>
            <div class="footer-line">Department of Computer Science &amp; Engineering</div>
            <div class="footer-line">University of Barishal</div>
          </div>
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