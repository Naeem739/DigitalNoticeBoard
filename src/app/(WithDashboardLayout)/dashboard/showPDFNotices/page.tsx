/* eslint-disable @typescript-eslint/no-explicit-any */
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
  pdfUrl?: string
  pdfFileName?: string
  createdAt?: Date
  category?: string
  categoryName?: string
  source?: 'notice' | 'pdf' | 'dashboard'
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
      
      // Fetch notices from Notice table
      const noticeResponse = await fetch('/api/notice/get-all')
      const noticeResult = await noticeResponse.json()

      // Fetch dashboards to extract PDF widgets from containers
      const dashboardsResponse = await fetch('/api/dashboard/get-all', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const dashboardsResult = await dashboardsResponse.json()

      // Fetch PDFs table for cross-referencing legacy container ids
      const pdfResponse = await fetch('/api/pdf/get-all')
      const pdfResult = await pdfResponse.json()

      const aggregated: TPDF[] = []

      // Add PDFs from Notice table
      if (noticeResult.success && Array.isArray(noticeResult.result)) {
        const noticesWithPDFs = noticeResult.result
          .filter((notice: any) => notice.pdfUrl || notice.pdfFileName)
          .map((notice: any) => ({
            id: notice.id,
            title: notice.title,
            pdfUrl: notice.pdfUrl,
            pdfFileName: notice.pdfFileName,
            createdAt: notice.createdAt,
            category: notice.category,
            categoryName: notice.categoryName,
            source: 'notice' as const
          }))
        aggregated.push(...noticesWithPDFs)
      }

      // Helper to extract PDFs from Dashboard containers (same as /notices/all)
      const extractPdfNoticesFromDashboards = (): TPDF[] => {
        if (!dashboardsResult?.success || !Array.isArray(dashboardsResult.result)) return []
        const out: TPDF[] = []

        const pdfById: Record<string, any> = {}
        if (pdfResult?.success && Array.isArray(pdfResult.result)) {
          for (const p of pdfResult.result) {
            pdfById[p.id] = p
          }
        }

        dashboardsResult.result.forEach((dash: any) => {
          const containers = dash?.containers
          if (!containers || !Array.isArray(containers)) return

          containers.forEach((container: any) => {
            const type = container?.type || container?.widgetType
            if (type !== 'pdf') return

            // Case 1: new schema with container.pdfs array
            if (Array.isArray(container.pdfs) && container.pdfs.length > 0) {
              container.pdfs.forEach((pdf: any, idx: number) => {
                if (!pdf?.pdfUrl && !pdf?.url) return
                out.push({
                  id: `${dash.id}:${container.id}:pdf:${pdf.id ?? idx}`,
                  title: pdf.title || container.title || 'PDF Document',
                  pdfUrl: pdf.pdfUrl || pdf.url,
                  pdfFileName: pdf.fileName || pdf.title || 'document.pdf',
                  createdAt: pdf.createdAt || dash.createdAt,
                  category: 'PDF',
                  categoryName: 'PDF',
                  source: 'dashboard' as const
                })
              })
            }
            // Case 2: container has a single pdfUrl/url
            else if (container?.pdfUrl || container?.url) {
              out.push({
                id: `${dash.id}:${container.id}:pdf`,
                title: container.title || 'PDF Document',
                pdfUrl: container.pdfUrl || container.url,
                pdfFileName: container.pdfFileName || (container.title ? `${container.title}.pdf` : 'document.pdf'),
                createdAt: dash.createdAt,
                category: 'PDF',
                categoryName: 'PDF',
                source: 'dashboard' as const
              })
            }
            // Case 3: legacy ids referencing Pdf table
            else if (Array.isArray(container?.pdfIds) && container.pdfIds.length > 0) {
              container.pdfIds.forEach((id: string) => {
                const p = pdfById[id]
                if (!p) return
                out.push({
                  id: `${dash.id}:${container.id}:pdfId:${id}`,
                  title: p.title || container.title || 'PDF Document',
                  pdfUrl: p.pdfUrl,
                  pdfFileName: p.fileName || p.title || 'document.pdf',
                  createdAt: p.createdAt || dash.createdAt,
                  category: 'PDF',
                  categoryName: 'PDF',
                  source: 'dashboard' as const
                })
              })
            }
          })
        })

        return out
      }

      // Get PDFs from Dashboard containers
      const dashboardPdfNotices = extractPdfNoticesFromDashboards()
      aggregated.push(...dashboardPdfNotices)

      // Add PDFs from Pdf table (standalone PDFs)
      if (pdfResult.success && Array.isArray(pdfResult.result)) {
        const pdfsFromTable = pdfResult.result.map((p: any) => ({
          id: p.id,
          title: p.title || p.fileName || 'PDF',
          pdfUrl: p.pdfUrl,
          pdfFileName: p.fileName,
          createdAt: p.createdAt,
          source: 'pdf' as const
        }))
        aggregated.push(...pdfsFromTable)
      }

      // Remove duplicates by pdfUrl (same PDF might appear in multiple places)
      const uniquePDFs = Array.from(
        new Map(aggregated.map((pdf: TPDF) => [pdf.pdfUrl || pdf.id, pdf])).values()
      )

      // Sort by creation date (most recent first)
      const sortedPDFs = uniquePDFs.sort((a: TPDF, b: TPDF) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })

      setPdfs(sortedPDFs)
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
      const pdfItem = pdfs.find(p => p.id === pdfId)
      
      // Handle different PDF sources (same logic as /notices/all)
      if (pdfId.includes(':pdfId:')) {
        // Extract the actual PDF ID from the synthetic ID
        const parts = pdfId.split(':pdfId:')
        const actualPdfId = parts[parts.length - 1]
        const response = await fetch(`/api/pdf/delete?id=${actualPdfId}`, {
          method: 'DELETE'
        })
        const result = await response.json()
        
        if (result.success) {
          setPdfs(prev => prev.filter(pdf => pdf.id !== pdfId))
          toast.success('PDF deleted successfully')
        } else {
          toast.error('Failed to delete PDF')
        }
      } else if (pdfId.includes(':') && pdfId.includes(':pdf')) {
        // Dashboard container PDF - delete from storage and container
        const parts = pdfId.split(':')
        const dashboardId = parts[0]
        const containerId = parts[1]
        
        if (pdfItem?.pdfUrl) {
          // Delete from storage
          try {
            await fetch(`/api/storage/delete?url=${encodeURIComponent(pdfItem.pdfUrl)}&bucket=pdfs`, {
              method: 'DELETE'
            })
          } catch (error) {
            console.error('Error deleting PDF from storage:', error)
          }
          
          // Remove from dashboard container
          if (dashboardId && containerId) {
            try {
              await fetch(`/api/dashboard/remove-pdf?dashboardId=${dashboardId}&containerId=${containerId}&pdfUrl=${encodeURIComponent(pdfItem.pdfUrl)}`, {
                method: 'DELETE'
              })
            } catch (error) {
              console.error('Error removing PDF from dashboard:', error)
            }
          }
        }
        
        setPdfs(prev => prev.filter(pdf => pdf.id !== pdfId))
        toast.success('PDF deleted successfully')
      } else {
        // Regular notice or Pdf table PDF
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
      if (pdf.pdfUrl) {
        // Download from Supabase Storage URL
        const link = document.createElement('a')
        link.href = pdf.pdfUrl
        link.download = pdf.pdfFileName || `${pdf.title}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('PDF download started!')
      } else {
        toast.error('PDF URL not available')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Error downloading PDF')
    }
  }

  const handleViewFullSize = (pdf: TPDF) => {
    try {
      if (pdf.pdfUrl) {
        // Open PDF from Supabase Storage URL in new window
        window.open(pdf.pdfUrl, '_blank')
      } else {
        toast.error('PDF URL not available')
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