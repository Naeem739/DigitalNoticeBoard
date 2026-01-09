import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import puppeteer from 'puppeteer'
import QRCode from 'qrcode'

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
    
    // Generate Notice ID: BU/CSE/{CategoryName}/{Year}/{NoticeNumber}
    let formattedNoticeId = ''
    if (notice.createdAt) {
      const noticeDate = new Date(notice.createdAt)
      const currentYear = noticeDate.getFullYear()
      const yearStart = new Date(currentYear, 0, 1)
      const yearEnd = new Date(currentYear + 1, 0, 1)
      
      // Get all notices in the same category created in the same year, ordered by createdAt
      const sameCategoryYearNotices = await prisma.notice.findMany({
        where: {
          categoryId: notice.categoryId,
          createdAt: {
            gte: yearStart,
            lt: yearEnd
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          id: true,
          createdAt: true
        }
      })
      
      // Find the position of current notice (1-indexed)
      const noticeIndex = sameCategoryYearNotices.findIndex(n => n.id === notice.id)
      // If notice is found, use its index + 1. If not found (shouldn't happen), use length + 1 as fallback
      const noticeNumber = noticeIndex >= 0 ? noticeIndex + 1 : sameCategoryYearNotices.length + 1
      
      // Format notice number as 3-digit padded (e.g., 001, 012, 123)
      const formattedNoticeNumber = noticeNumber.toString().padStart(3, '0')
      
      // Escape category name for Notice ID
      const categoryNameForId = categoryName.replace(/[^a-zA-Z0-9]/g, '') // Remove special characters, keep only alphanumeric
      
      formattedNoticeId = `BU/CSE/${categoryNameForId}/${currentYear}/${formattedNoticeNumber}`
    }
    
    // Generate QR code data URL for this notice (used in print footer)
    const baseUrl = request.nextUrl.origin
    const qrContent = `${baseUrl}/api/notice/download/${notice.id}`
    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      width: 50,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    // Escape Notice ID to prevent XSS
    const escapedNoticeId = formattedNoticeId ? formattedNoticeId.replace(/[<>&'"]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&#39;',
        '"': '&quot;'
      }
      return entities[char]
    }) : ''
    
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
            font-family: 'Tiro Bangla', 'Kalpurush', 'SolaimanLipi', 'Segoe UI', Tahoma, sans-serif;
            padding: 0;
            line-height: 1.6;
            color: #000;
            background: white;
          }
          
          .page-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm 15mm;
          }
          
          /* Header Section */
          .header-section {
            border-bottom: 2px solid #000;
            padding-bottom: 8mm;
            margin-bottom: 8mm;
            position: relative;
          }
          
          .header-top {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15mm;
            margin-bottom: 5mm;
          }
          

          
          .header-title {
            text-align: center;
            flex: 1;
          }
          
          .header-title h1 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 3mm;
            color: #000;
          }
          
          .header-title h2 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 2mm;
            color: #000;
          }
          
          .header-contact {
            font-size: 11px;
            text-align: center;
            color: #000;
            line-height: 1.4;
          }
          
          .reference-line {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-top: 5mm;
            color: #000;
          }
          
          .ref-number {
            text-align: left;
          }
          
          .ref-date {
            text-align: right;
          }
          
          /* Notice ID */
          .notice-id {
            text-align: left;
            margin-bottom: 3mm;
            font-size: 13px;
            color: #000;
            font-weight: 600;
          }
          
          /* Notice Title */
          .notice-title {
            text-align: center;
            margin: 8mm 0;
            padding-bottom: 5mm;
          }
          
          .notice-title h3 {
            font-size: 20px;
            font-weight: 700;
            text-decoration: underline;
            color: #000;
          }
          
          /* Content Section */
          .content-section {
            margin-bottom: 10mm;
          }
          
          .notice-meta {
            margin-bottom: 8mm;
            font-size: 13px;
            color: #000;
            display: flex;
            flex-wrap: wrap;
            gap: 5mm;
          }
          
          .meta-item {
            display: inline-block;
          }
          
          .meta-label {
            font-weight: 600;
            margin-right: 2mm;
          }
          
          .notice-content {
            margin-top: 5mm;
          }
          
          .notice-content h4 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 3mm;
            color: #000;
          }
          
          .notice-content .content-body {
            font-size: 14px;
            line-height: 1.8;
            text-align: justify;
            color: #000;
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
            z-index: 1000;
          }
          
          .print-button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-2px);
          }
          
          @media print {
            .print-button {
              display: none;
            }
            
            body {
              background: white;
              counter-reset: page-counter;
            }
            
            .page-container {
              padding: 0;
            }
            
            .header-section {
              break-after: avoid;
            }
          }
          
          @page {
            size: A4;
            margin: 20mm 15mm 25mm 15mm;
            counter-increment: page-counter;
            
            /* Left: QR code */
            @bottom-left {
              content: url('${qrDataUrl}');
            }
            
            /* Center: digital notice text */
            @bottom-center {
              content: "This notice is issued digitally and does not require a physical signature.";
              font-size: 12px;
              color: #000;
              text-align: center;
              font-style: italic;
              font-family: 'Tiro Bangla', 'Kalpurush', 'SolaimanLipi', 'Segoe UI', Tahoma, sans-serif;
            }
            
            /* Right: page number: Page X of Y */
            @bottom-right {
              content: "Page " counter(page-counter) " of " counter(pages);
              font-size: 12px;
              color: #666;
              text-align: right;
              font-family: 'Tiro Bangla', 'Kalpurush', 'SolaimanLipi', 'Segoe UI', Tahoma, sans-serif;
            }
          }
          
          @page :first {
            margin-top: 10mm;
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print</button>
        
        <div class="page-container">
          <!-- Header Section -->
          <div class="header-section">
            <div class="header-top">
              <div class="header-title">
                <h1>Digital Notice Board</h1>
                <h2>Dept. of Computer Science and Engineering</h2>
                <div class="header-contact">
                  University of Barishal
                </div>
              </div>
            </div>
            
            <div class="reference-line">
              <div class="ref-number">
                <strong>Category:</strong> ${escapedCategory}${formattedNoticeId ? `<br><strong>Notice ID:</strong> ${escapedNoticeId}` : ''}
              </div>
              <div class="ref-date">
                <strong>Date:</strong> ${createdDate}<br>
                <strong>Updated:</strong> ${updatedDate}
              </div>
            </div>
          </div>
          
          <!-- Notice Title -->
          <div class="notice-title">
            <h3>NOTICE</h3>
          </div>
          
          <!-- Content Section -->
          <div class="content-section">
            <div class="notice-content">
              <h4>${escapedTitle}</h4>
              <div class="content-body">
                ${noticeContent}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    // If requested as PDF, render server-side with no browser headers/footers
    const format = request.nextUrl.searchParams.get('format')
    if (format === 'pdf') {
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      try {
        const page = await browser.newPage()
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          displayHeaderFooter: false,
          margin: { top: '20mm', right: '15mm', bottom: '25mm', left: '15mm' }
        })
        await page.close()
        return new NextResponse(Buffer.from(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${escapedTitle}.pdf"`,
          },
        })
      } finally {
        await browser.close()
      }
    }

    // Default: return HTML content for browser print
    return new NextResponse(htmlContent, { headers: { 'Content-Type': 'text/html' } })

  } catch (error) {
    console.error('Error generating notice download:', error)
    return NextResponse.json({ 
      error: 'Failed to generate download',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}