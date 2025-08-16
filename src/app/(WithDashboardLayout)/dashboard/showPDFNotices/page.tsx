'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, FileText, Download, Eye } from 'lucide-react'
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

  const fetchPDFs = async () => {
    try {
      setLoading(true)
      // Fetch from Notice model instead of a separate PDF model
      const response = await fetch('/api/notice/get-all')
      const data = await response.json()
      
      if (data.success) {
        // Filter notices that have pdfData
        const noticesWithPDFs = data.result.filter((notice: any) => notice.pdfData)
        setPdfs(noticesWithPDFs || [])
      } else {
        toast.error('Failed to fetch PDFs')
      }
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
      // Delete from notice instead of a separate PDF model
      const response = await fetch(`/api/notice/delete?id=${pdfId}`, {
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
      const byteCharacters = atob(pdf.pdfData)
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
                  max-width: 90vw;
                  max-height: 90vh;
                  overflow: auto;
                }
                embed {
                  width: 100%;
                  height: 80vh;
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
                <embed src="data:application/pdf;base64,${pdf.pdfData}" type="application/pdf" />
                <div class="pdf-info">
                  <div class="pdf-title">${pdf.title}</div>
                  <div class="pdf-details">
                    Category: ${pdf.categoryName || pdf.category || 'N/A'} | ID: ${pdf.id}
                    ${pdf.createdAt ? ` | Created: ${new Date(pdf.createdAt).toLocaleDateString()}` : ''}
                  </div>
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
        <div>
          <h1 className="text-3xl font-bold">PDF Notices</h1>
          <p className="text-gray-600 mt-2">Manage all notices with PDFs</p>
        </div>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pdfs.map((pdf) => (
            <Card key={pdf.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium truncate" title={pdf.title}>
                    {pdf.pdfFileName || pdf.title}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPDF(pdf)}
                      className="h-8 w-8 p-0"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFullSize(pdf)}
                      className="h-8 w-8 p-0"
                      title="View Full Size"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {userRole !== 'USER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePDF(pdf.id)}
                        disabled={deletingId === pdf.id}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        {deletingId === pdf.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-red-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">PDF Document</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Category: {pdf.categoryName || pdf.category || 'N/A'}</span>
                    <span>{formatDate(pdf.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 