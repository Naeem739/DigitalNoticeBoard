'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, FileText, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

type TPDF = {
  id: string
  title: string
  pdfData: string
  pdfFileName?: string
  createdAt?: Date
  category?: string
  categoryName?: string
  source?: 'notice' | 'pdf'
}

export default function ShowPDFNotices() {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const [pdfs, setPdfs] = useState<TPDF[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPDFs()
  }, [])

  const stripDataUrlPrefix = (data: string) => {
    return data.replace(/^data:application\/pdf;base64,/, '')
  }

  const fetchPDFs = async () => {
    try {
      setLoading(true)
      // Fetch PDFs from Notice model first
      const noticeRes = await fetch('/api/notice/get-all')
      const noticeJson = await noticeRes.json()

      const aggregated: TPDF[] = []

      if (noticeJson.success && Array.isArray(noticeJson.result)) {
        const noticesWithPDFs = noticeJson.result
          .filter((notice: any) => !!notice.pdfData)
          .map((notice: any) => ({
            id: notice.id,
            title: notice.title,
            pdfData: stripDataUrlPrefix(notice.pdfData),
            pdfFileName: notice.pdfFileName,
            createdAt: notice.createdAt,
            category: notice.category,
            categoryName: notice.categoryName,
            source: 'notice' as const
          }))
        aggregated.push(...noticesWithPDFs)
      }

      // Also fetch from legacy/separate PDF model to ensure nothing is missed
      const pdfRes = await fetch('/api/pdf/get-all')
      const pdfJson = await pdfRes.json()
      if (pdfJson.success && Array.isArray(pdfJson.result)) {
        const pdfsFromTable = pdfJson.result.map((p: any) => ({
          id: p.id,
          title: p.title || p.fileName || 'PDF',
          pdfData: stripDataUrlPrefix(p.pdfData),
          pdfFileName: p.fileName,
          createdAt: p.createdAt,
          source: 'pdf' as const
        }))
        aggregated.push(...pdfsFromTable)
      }

      // Remove duplicates by id if any
      const byId = new Map<string, TPDF>()
      for (const item of aggregated) {
        if (!byId.has(item.id)) byId.set(item.id, item)
      }
      setPdfs(Array.from(byId.values()))
    } catch (error) {
      console.error('Error fetching PDFs:', error)
      toast.error('Error fetching PDFs')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePDF = async (pdfId: string) => {
    if (!confirm('Are you sure you want to delete this PDF? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(pdfId)
      // Decide delete endpoint by source
      const pdfItem = pdfs.find(p => p.id === pdfId)
      const endpoint = pdfItem?.source === 'pdf' ? '/api/pdf/delete' : '/api/notice/delete'
      const response = await fetch(`${endpoint}?id=${pdfId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        setPdfs(prev => prev.filter(pdf => pdf.id !== pdfId))
        toast.success('PDF deleted successfully')
      } else {
        toast.error('Failed to delete PDF')
      }
    } catch (error) {
      console.error('Error deleting PDF:', error)
      toast.error('Error deleting PDF')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownloadPDF = (pdf: TPDF) => {
    try {
      // Create a blob from the base64 data
      const base64 = stripDataUrlPrefix(pdf.pdfData)
      const byteCharacters = atob(base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = pdf.pdfFileName || `${pdf.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Error downloading PDF')
    }
  }

  const handleViewFullSize = (pdf: TPDF) => {
    try {
      // Create a new window with the PDF
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        const base64 = stripDataUrlPrefix(pdf.pdfData)
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${pdf.title}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #f5f5f5;
                  font-family: Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  min-height: 100vh;
                }
                .pdf-container {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  width: 95vw;
                  height: 95vh;
                  overflow: auto;
                }
                embed {
                  width: 100%;
                  height: 90vh;
                  border-radius: 4px;
                }
                .pdf-info {
                  margin-top: 15px;
                  text-align: center;
                  color: #666;
                }
                .pdf-title {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 5px;
                  color: #333;
                }
                .pdf-details {
                  font-size: 14px;
                  color: #888;
                }
              </style>
            </head>
            <body>
              <div class="pdf-container">
                <embed src="data:application/pdf;base64,${base64}" type="application/pdf" />
                <div class="pdf-info">
                </div>
              </div>
            </body>
          </html>
        `)
        newWindow.document.close()
      } else {
        // Fallback if popup is blocked
        toast.error('Please allow popups to view full-size PDFs')
      }
    } catch (error) {
      console.error('Error opening full-size PDF:', error)
      toast.error('Error opening full-size PDF')
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDFs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
       
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-red-600" />
          <span className="text-lg font-semibold">{pdfs.length} PDFs</span>
        </div>
      </div>

      {pdfs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No PDFs Found</h3>
            <p className="text-gray-500 text-center">
              No notices with PDFs have been created yet. PDFs will appear here once notices with PDFs are added.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {pdfs.map((pdf) => (
            <Card key={pdf.id} className="group relative overflow-hidden bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleViewFullSize(pdf)}>
              {/* Professional gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Header with better spacing */}
              <CardHeader className="pb-2 pt-3 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xs font-semibold text-gray-800 truncate leading-tight" title={pdf.title}>
                      {pdf.pdfFileName || pdf.title}
                    </CardTitle>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                      {pdf.categoryName || pdf.category || 'Uncategorized'}
                    </p>
                  </div>
                  
                  {/* Action buttons with better styling */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(pdf);
                      }}
                      className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    {userRole !== 'USER' && (
                                              <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePDF(pdf.id);
                          }}
                          disabled={deletingId === pdf.id}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete PDF"
                        >
                        {deletingId === pdf.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {/* PDF preview area */}
              <CardContent className="pt-0 pb-3 relative z-10">
                <div className="relative aspect-[4/3] bg-white rounded-xl overflow-hidden mb-2 flex items-center justify-center border border-gray-200 group-hover:border-blue-200 transition-colors duration-300">
                  <div className="flex flex-col items-center select-none">
                    {/* Windows-like PDF icon */}
                    <div className="relative w-14 h-16 bg-white shadow-sm border border-gray-200 rounded-sm">
                      {/* folded corner */}
                      <div className="absolute right-0 top-0 w-0 h-0 border-t-[16px] border-t-gray-200 border-l-[16px] border-l-transparent"></div>
                      {/* red PDF ribbon */}
                      <div className="absolute left-0 right-0 top-6 mx-auto h-5 bg-red-600 flex items-center justify-center">
                        <span className="text-[11px] font-bold tracking-wider text-white">PDF</span>
                      </div>
                    </div>
                    {/* filename text under icon */}
                    <p className="mt-1 max-w-[90%] text-[11px] font-medium text-gray-700 truncate" title={(pdf.pdfFileName || pdf.title) ?? ''}>
                      {pdf.pdfFileName || pdf.title}
                    </p>
                  </div>
                </div>
                
                {/* Footer info */}
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1 text-gray-500">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span>PDF</span>
                  </div>
                  <span className="text-gray-400 font-medium">{formatDate(pdf.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 