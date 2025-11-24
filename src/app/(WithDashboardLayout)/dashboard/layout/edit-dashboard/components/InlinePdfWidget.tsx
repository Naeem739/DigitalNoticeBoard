/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Upload } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"
import { toast } from "sonner"

function InlinePdfWidget({ widgetId, onPdfStored }: { widgetId: string, onPdfStored: (pdfId: string, pdfData: string, fileName: string) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [currentPdfData, setCurrentPdfData] = useState<string | null>(null)
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)
  const [isLoadingExisting, setIsLoadingExisting] = useState(false)
  const [existingPdfs, setExistingPdfs] = useState<Array<any>>([])
  const [animateOpen, setAnimateOpen] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 9
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Configure worker once on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString()
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Load existing PDF data from TemporaryDashboard on mount and set up real-time updates
  useEffect(() => {
    const loadExistingPdf = async () => {
      try {
        const response = await fetch('/api/temp-dashboard/get-all')
        const result = await response.json()
        
        if (result.success && result.result.length > 0) {
          // Find the temp dashboard that contains this widget
          for (const tempDashboard of result.result) {
            if (tempDashboard.containers) {
              const containers = Array.isArray(tempDashboard.containers) ? tempDashboard.containers : JSON.parse(tempDashboard.containers)
              const widgetContainer = containers.find((container: any) => container.id === widgetId)
              
              if (widgetContainer && widgetContainer.pdfData) {
                console.log("Found PDF data in temp dashboard for widget:", widgetId)
                setCurrentPdfData(widgetContainer.pdfData)
                try {
                  await renderPdfFromData(widgetContainer.pdfData)
                } catch (renderError) {
                  console.error('Error rendering PDF from temp dashboard:', renderError)
                  toast.error('Failed to load PDF from saved data. The file may be corrupted.')
                }
                break
              }
            }
          }
        }
        
        // If no PDF data found in temp dashboard, try to recover from localStorage backup
        if (!currentPdfData) {
          try {
            const backupKey = `pdf-backup-${widgetId}`
            const backupData = localStorage.getItem(backupKey)
            if (backupData) {
              const parsed = JSON.parse(backupData)
              // Check if backup is recent (within last hour)
              if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
                setCurrentPdfData(parsed.pdfData)
                try {
                  await renderPdfFromData(parsed.pdfData)
                  console.log("Recovered PDF data from localStorage backup")
                  
                  // Try to save to temp dashboard again
                  setTimeout(() => {
                    saveToTempDashboard(parsed.pdfData, parsed.fileName)
                  }, 1000)
                } catch (renderError) {
                  console.error('Error rendering PDF from localStorage backup:', renderError)
                  toast.error('Failed to load PDF from backup. The file may be corrupted.')
                }
              } else {
                // Remove old backup
                localStorage.removeItem(backupKey)
              }
            }
          } catch (backupError) {
            console.error("Error recovering PDF data from backup:", backupError)
          }
        }
      } catch (error) {
        console.error("Error loading existing PDF from temp dashboard:", error)
        
        // Try to recover from localStorage backup as fallback
        try {
          const backupKey = `pdf-backup-${widgetId}`
          const backupData = localStorage.getItem(backupKey)
          if (backupData) {
            const parsed = JSON.parse(backupData)
            if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
              setCurrentPdfData(parsed.pdfData)
              try {
                await renderPdfFromData(parsed.pdfData)
                console.log("Recovered PDF data from localStorage backup after API error")
              } catch (renderError) {
                console.error('Error rendering PDF from localStorage backup after API error:', renderError)
                toast.error('Failed to load PDF from backup. The file may be corrupted.')
              }
            }
          }
        } catch (backupError) {
          console.error("Error recovering PDF data from backup after API error:", backupError)
        }
      }
    }

    // Load on mount
    loadExistingPdf()
    
    // Set up real-time polling to check for updates every 2 seconds
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch('/api/temp-dashboard/get-all')
        const result = await response.json()
        
        if (result.success && result.result.length > 0) {
          for (const tempDashboard of result.result) {
            if (tempDashboard.containers) {
              const containers = Array.isArray(tempDashboard.containers) ? tempDashboard.containers : JSON.parse(tempDashboard.containers)
              const widgetContainer = containers.find((container: any) => container.id === widgetId)
              
              if (widgetContainer && widgetContainer.pdfData && widgetContainer.pdfData !== currentPdfData) {
                console.log("PDF data updated in temp dashboard for widget:", widgetId)
                setCurrentPdfData(widgetContainer.pdfData)
                try {
                  await renderPdfFromData(widgetContainer.pdfData)
                } catch (renderError) {
                  console.error('Error rendering updated PDF from temp dashboard:', renderError)
                  toast.error('Failed to load updated PDF. The file may be corrupted.')
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error polling temp dashboard for updates:", error)
      }
    }, 2000) // Check every 2 seconds
    
    return () => clearInterval(intervalId)
  }, [widgetId, currentPdfData])

  // Auto-save to TemporaryDashboard whenever PDF data changes
  useEffect(() => {
    if (currentPdfData) {
      const autoSaveTimer = setTimeout(() => {
        saveToTempDashboard(currentPdfData, 'auto-saved.pdf')
      }, 1000) // Save after 1 second of no changes
      
      return () => clearTimeout(autoSaveTimer)
    }
  }, [currentPdfData])

  // Auto-save entire dashboard state to TemporaryDashboard
  const autoSaveDashboardToTemp = async () => {
    try {
      // Get current temp dashboard data
      const response = await fetch('/api/temp-dashboard/get-all')
      const result = await response.json()
      
      if (result.success && result.result.length > 0) {
        // Update the first temp dashboard with current state
        const tempDashboard = result.result[0]
        const containers = Array.isArray(tempDashboard.containers) ? tempDashboard.containers : JSON.parse(tempDashboard.containers)
        
        // Update the widget container with current PDF data
        const updatedContainers = containers.map((container: any) => {
          if (container.id === widgetId && currentPdfData) {
            return {
              ...container,
              pdfData: currentPdfData,
              pdfFileName: 'auto-saved.pdf',
              type: "pdf"
            }
          }
          return container
        })

        // Update the temp dashboard
        const updateResponse = await fetch(`/api/temp-dashboard/update/${tempDashboard.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            containers: updatedContainers
          })
        })

        const updateResult = await updateResponse.json()
        if (updateResult.success) {
          console.log("Dashboard state auto-saved to temp dashboard")
        }
      }
    } catch (error) {
      console.error("Error auto-saving dashboard to temp:", error)
    }
  }

  // Auto-save dashboard state when component unmounts
  useEffect(() => {
    return () => {
      if (currentPdfData) {
        autoSaveDashboardToTemp()
      }
    }
  }, [currentPdfData])

  const startAutoScroll = () => {
    const container = containerRef.current
    if (!container) return
    // Reset to the top before starting
    container.scrollTop = 0
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const step = () => {
      container.scrollBy(0, 0.5)
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1
      if (atBottom) {
        container.scrollTop = 0
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const renderPdfFromData = async (pdfData: string) => {
    const container = containerRef.current
    if (!container) return
    
    try {
      // Clear container and show loading state
      container.innerHTML = ""
      
      // Validate PDF data
      if (!pdfData || pdfData.trim() === '') {
        throw new Error('No PDF data provided')
      }
      
      // Check if PDF data is valid base64
      const base64Regex = /^data:application\/pdf;base64,/
      if (!base64Regex.test(pdfData) && !pdfData.startsWith('data:application/pdf')) {
        // Try to add the data URL prefix if missing
        if (!pdfData.startsWith('data:')) {
          pdfData = `data:application/pdf;base64,${pdfData}`
        }
      }

      // Show loading indicator
      const loadingDiv = document.createElement('div')
      loadingDiv.className = 'flex items-center justify-center h-32 text-gray-500'
      loadingDiv.innerHTML = `
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto mb-2"></div>
          <p class="text-sm">Loading PDF...</p>
        </div>
      `
      container.appendChild(loadingDiv)

      // Load PDF document
      const pdf = await (pdfjsLib as any).getDocument(pdfData).promise
      
      // Clear loading indicator
      container.innerHTML = ""

      // Render each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          // Fit page width to container to avoid horizontal scroll
          const containerWidth = container.clientWidth || 600
          const baseViewport = page.getViewport({ scale: 1 })
          const fitScale = containerWidth / baseViewport.width
          const viewport = page.getViewport({ scale: fitScale })
          
          // Render at higher pixel density for crisp text
          const outputScale = typeof window !== "undefined" ? Math.max(2, window.devicePixelRatio || 1) : 2
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")
          
          if (!context) {
            throw new Error('Failed to get canvas context')
          }
          
          // Set canvas size for high DPI rendering
          canvas.width = Math.floor(viewport.width * outputScale)
          canvas.height = Math.floor(viewport.height * outputScale)
          
          // Set CSS size to display size (no blur) - this ensures it fits the widget
          canvas.style.width = "100%"
          canvas.style.height = "auto"
          
          // Scale context for high DPI rendering
          context.scale(outputScale, outputScale)
          
          await page.render({ 
            canvasContext: context, 
            viewport,
            canvas
          }).promise
          container.appendChild(canvas)
        } catch (pageError) {
          console.error(`Error rendering PDF page ${pageNum}:`, pageError)
          // Continue with other pages even if one fails
        }
      }

      // Ensure we begin from the first page
      container.scrollTop = 0
      startAutoScroll()
      
    } catch (error) {
      console.error('Error rendering PDF:', error)
      
      // Clear container and show error message
      container.innerHTML = ""
      
      const errorDiv = document.createElement('div')
      errorDiv.className = 'flex items-center justify-center h-32 text-red-500'
      errorDiv.innerHTML = `
        <div class="text-center">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <p class="text-sm font-medium">Failed to load PDF</p>
          <p class="text-xs text-gray-400 mt-1">The PDF file may be corrupted or invalid</p>
        </div>
      `
      container.appendChild(errorDiv)
      
      // Show toast error
      toast.error('Failed to load PDF. The file may be corrupted or invalid.')
    }
  }

  // Function to refresh dashboard state from TemporaryDashboard
  const refreshFromTempDashboard = async () => {
    try {
      console.log("Refreshing dashboard from TemporaryDashboard")
      const response = await fetch('/api/temp-dashboard/get-all')
      const result = await response.json()
      
      if (result.success && result.result.length > 0) {
        const tempDashboard = result.result[0]
        if (tempDashboard.containers && tempDashboard.containers.length > 0) {
          const containers = Array.isArray(tempDashboard.containers) ? tempDashboard.containers : JSON.parse(tempDashboard.containers)
          const pdfContainers = containers.filter((container: any) => container.type === 'pdf' && container.pdfData)
          
          if (pdfContainers.length > 0) {
            console.log("Refreshing PDF data for", pdfContainers.length, "widgets")
            const pdfContainer = pdfContainers.find((container: any) => container.id === widgetId)
            if (pdfContainer) {
              const genId = `pdf-${Date.now()}`
              onPdfStored(genId, pdfContainer.pdfData, pdfContainer.pdfFileName || 'uploaded.pdf')
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing from temp dashboard:', error)
    }
  }

  const saveToTempDashboard = async (pdfData: string, fileName: string) => {
    try {
      // Get current temp dashboard data
      const response = await fetch('/api/temp-dashboard/get-all')
      const result = await response.json()
      
      if (result.success && result.result.length > 0) {
        // Update the first temp dashboard with the new PDF data
        const tempDashboard = result.result[0]
        const containers = Array.isArray(tempDashboard.containers) ? tempDashboard.containers : JSON.parse(tempDashboard.containers)
        
        // Find and update the widget container
        const updatedContainers = containers.map((container: any) => {
          if (container.id === widgetId) {
            return {
              ...container,
              pdfData: pdfData,
              pdfFileName: fileName,
              type: "pdf"
            }
          }
          return container
        })

        // Update the temp dashboard
        const updateResponse = await fetch(`/api/temp-dashboard/update/${tempDashboard.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            containers: updatedContainers
          })
        })

        const updateResult = await updateResponse.json()
        if (updateResult.success) {
          console.log("PDF data saved to temp dashboard successfully")
          // Trigger immediate refresh to display the updated PDF
          setTimeout(() => {
            refreshFromTempDashboard()
          }, 500)
        } else {
          console.error("Failed to save PDF data to temp dashboard:", updateResult)
        }
              } else {
        // No temp dashboard exists yet, create one with current widget data
        console.log("No temp dashboard found, creating one with PDF data")
        try {
          const createResponse = await fetch('/api/temp-dashboard/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              aspectRatio: '16:9', // Default aspect ratio
              containers: [{
                id: widgetId,
                type: 'pdf',
                pdfData: pdfData,
                pdfFileName: fileName
              }],
              screenName: 'Screen 1',
              screenIndex: 0,
              totalScreens: 1
            })
          })

          const createResult = await createResponse.json()
          if (createResult.success) {
            console.log("Created new temp dashboard with PDF data")
            // Trigger immediate refresh to display the PDF
            setTimeout(() => {
              refreshFromTempDashboard()
            }, 500)
          } else {
            console.warn("Failed to create temp dashboard:", createResult.error)
          }
        } catch (error) {
          console.error("Error creating temp dashboard:", error)
          // Fallback: store PDF data in localStorage as backup
          try {
            const backupData = {
              widgetId,
              pdfData,
              fileName,
              timestamp: Date.now()
            }
            localStorage.setItem(`pdf-backup-${widgetId}`, JSON.stringify(backupData))
            console.log("PDF data backed up to localStorage")
          } catch (localStorageError) {
            console.error("Failed to backup PDF data to localStorage:", localStorageError)
          }
        }
      }
    } catch (error) {
      console.error("Error saving PDF to temp dashboard:", error)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== "application/pdf") {
      toast.error("Please select a valid PDF file")
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("PDF file size must be less than 10MB")
      return
    }

    try {
      setIsUploading(true)
      const loadingToast = toast.loading('Uploading PDF...')

      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const pdfData = event.target?.result as string
          setCurrentPdfData(pdfData)
          
          // Render the uploaded PDF
          await renderPdfFromData(pdfData)
          
          // Save to TemporaryDashboard immediately
          await saveToTempDashboard(pdfData, file.name)
          
          // Generate a unique ID for the PDF
          const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          
          // Notify parent component about the stored PDF with data
          onPdfStored(pdfId, pdfData, file.name)
          
          toast.dismiss(loadingToast)
          toast.success('PDF uploaded and stored successfully!')
        } catch (error) {
          console.error("Error processing PDF:", error)
          toast.dismiss(loadingToast)
          toast.error("Failed to process PDF")
        }
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading PDF:", error)
      toast.error("Failed to upload PDF")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="pb-2 flex items-center gap-2">
        <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm cursor-pointer bg-white hover:bg-gray-50 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Upload size={16} />
          <span>{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
          <input 
            className="hidden" 
            type="file" 
            accept="application/pdf" 
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
        <button
          type="button"
          onClick={async () => {
            try {
              setIsSelectModalOpen(true)
              // start animation immediately
              requestAnimationFrame(() => setAnimateOpen(true))
              setIsLoadingExisting(true)
              const resp = await fetch('/api/notice/get-all')
              const data = await resp.json()
              // Filter notices that have pdfData
              const pdfNotices = (data?.result || []).filter((n: any) => n?.pdfData)
              console.log('Found PDF notices:', pdfNotices.length, pdfNotices.map((n: any) => ({ 
                title: n.title, 
                fileName: n.pdfFileName, 
                hasPdfData: !!n.pdfData,
                pdfDataLength: n.pdfData?.length || 0,
                pdfDataPrefix: n.pdfData?.substring(0, 50) || 'none'
              })))
              
              // Ensure PDF data has proper format for rendering
              const processedPdfNotices = pdfNotices.map((n: any) => {
                let pdfData = n.pdfData || ''
                
                // Ensure PDF data has data URL prefix for proper rendering
                if (pdfData && !pdfData.startsWith('data:')) {
                  pdfData = `data:application/pdf;base64,${pdfData}`
                  console.log('Added data URL prefix to PDF:', n.pdfFileName)
                }
                
                return {
                  ...n,
                  pdfData: pdfData
                }
              })
              
              // Deduplicate strictly by file name
              const seen = new Set<string>()
              const unique = [] as any[]
              for (const n of processedPdfNotices) {
                const key = (n?.pdfFileName ?? '').toString().trim().toLowerCase()
                if (!key) continue
                if (!seen.has(key)) {
                  seen.add(key)
                  unique.push(n)
                }
              }
              setExistingPdfs(unique)
            } catch (e) {
              console.error('Failed to load existing PDFs', e)
              toast.error('Failed to load existing PDFs. Please try again.')
              setExistingPdfs([])
            } finally {
              setIsLoadingExisting(false)
            }
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm bg-white hover:bg-gray-50"
        >
          <Upload size={16} />
          <span>From Existing</span>
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden border rounded-md"
        style={{ background: "#fff" }}
      />

      {isSelectModalOpen && createPortal(
        <div className="fixed inset-0 z-[1000]">
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-150 ${animateOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => {
              setAnimateOpen(false)
              setTimeout(() => setIsSelectModalOpen(false), 200)
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-[92vw] max-w-5xl max-h-[85vh] overflow-hidden transition-all duration-150 transform ${animateOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'}`}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3 text-base font-semibold text-gray-800">
                  <div className="p-2 rounded-lg bg-white border border-gray-200"><Upload size={18} className="text-indigo-600" /></div>
                  Choose Existing PDF
                </div>
                <button
                  onClick={() => {
                    setAnimateOpen(false)
                    setTimeout(() => setIsSelectModalOpen(false), 200)
                  }}
                  className="h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-700 grid place-items-center"
                >
                  ✕
                </button>
              </div>
              <div className="px-6 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search by title or file name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const q = e.target.value.trim().toLowerCase()
                      setPage(1)
                      setExistingPdfs((prev: any[]) => prev.map(p => ({ ...p, __hidden: q ? !((p.title||'').toLowerCase().includes(q) || (p.pdfFileName||'').toLowerCase().includes(q)) : false })))
                    }}
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value)
                      setPage(1)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    title="Filter by PDF category"
                  >
                    <option value="all">All categories</option>
                    {[...new Set(existingPdfs.map((p: any) => (p.category || p.categoryName || '').toString().trim()).filter(Boolean))]
                      .map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                  </select>
                  <div className="text-xs text-gray-500">{existingPdfs.filter((p: any) => !p.__hidden).length} item{existingPdfs.filter((p: any) => !p.__hidden).length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div className="p-6 bg-white">
                {isLoadingExisting ? (
                  <div className="flex items-center justify-center py-16 text-sm text-gray-500">Loading PDFs...</div>
                ) : existingPdfs.length === 0 ? (
                  <div className="text-center py-16 text-sm text-gray-500">No existing PDF notices found.</div>
                ) : (
                  <>
                    {(() => {
                      const byCategory = existingPdfs.filter((p: any) => {
                        if (categoryFilter === 'all') return true
                        const cat = (p.category || p.categoryName || '').toString().trim()
                        return cat === categoryFilter
                      })
                      const visible = byCategory.filter((p: any) => !p.__hidden)
                      const total = visible.length
                      const totalPages = Math.max(1, Math.ceil(total / perPage))
                      const current = Math.min(page, totalPages)
                      const start = (current - 1) * perPage
                      const end = start + perPage
                      const paged = visible.slice(start, end)
                      return (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                            {paged.map((n: any) => (
                      <button
                        key={n.id}
                        className="group text-left rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all bg-white p-4 flex items-start gap-3"
                        onClick={async () => {
                          try {
                            console.log('Selecting PDF:', { 
                              title: n.title, 
                              fileName: n.pdfFileName, 
                              hasPdfData: !!n.pdfData,
                              pdfDataLength: n.pdfData?.length || 0,
                              pdfDataPrefix: n.pdfData?.substring(0, 50) || 'none'
                            })
                            
                            if (!n.pdfData) {
                              toast.error('No PDF data found for this file')
                              return
                            }
                            
                            // Validate PDF data before processing
                            if (typeof n.pdfData !== 'string' || n.pdfData.trim() === '') {
                              toast.error('Invalid PDF data format')
                              return
                            }
                            
                            setCurrentPdfData(n.pdfData)
                            
                            // Try to render the PDF first to validate it
                            try {
                              await renderPdfFromData(n.pdfData)
                            } catch (renderError) {
                              console.error('Error rendering selected PDF:', renderError)
                              toast.error('Failed to load PDF. The file may be corrupted.')
                              return
                            }
                            
                            await saveToTempDashboard(n.pdfData, n.pdfFileName || 'uploaded.pdf')
                            const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
                            onPdfStored(pdfId, n.pdfData, n.pdfFileName || 'uploaded.pdf')
                            setIsSelectModalOpen(false)
                            toast.success('PDF selected successfully')
                          } catch (err) {
                            console.error('Error selecting existing PDF:', err)
                            toast.error('Failed to select PDF. Please try again.')
                          }
                        }}
                        title={n.pdfFileName || 'PDF'}
                      >
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-blue-50 text-blue-600 grid place-items-center border border-blue-100">PDF</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{n.pdfFileName || 'PDF'}</div>
                          <div className="text-xs text-gray-400 truncate">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                        </div>
                      </button>
                            ))}
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-4">
                            <div className="text-xs text-gray-500">
                              Showing {total === 0 ? 0 : start + 1}-{Math.min(end, total)} of {total}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="px-3 py-1.5 text-sm border rounded-md bg-white disabled:opacity-50"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={current <= 1}
                              >
                                Prev
                              </button>
                              <div className="text-sm text-gray-600">Page {current} of {totalPages}</div>
                              <button
                                className="px-3 py-1.5 text-sm border rounded-md bg-white disabled:opacity-50"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={current >= totalPages}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>, document.body)
      }
    </div>
  )
}

export default InlinePdfWidget


