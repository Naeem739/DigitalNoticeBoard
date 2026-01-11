/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Upload } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"
import { toast } from "sonner"

function InlinePdfWidget({ widgetId, onPdfStored }: { widgetId: string, onPdfStored: (pdfId: string, pdfUrl: string, fileName: string, pdfimage?: string) => void }) {
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
      // Fix for Next.js - use CDN with specific version
      try {
        // Use unpkg CDN with the installed version (5.4.54)
        ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs`
        console.log('PDF.js worker configured:', (pdfjsLib as any).GlobalWorkerOptions.workerSrc)
      } catch (error) {
        console.error('Failed to configure PDF.js worker:', error)
        // Fallback to alternative CDN
        try {
          ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs`
        } catch (fallbackError) {
          console.error('Failed to configure PDF.js worker fallback:', fallbackError)
        }
      }
    }
    return () => {
      stopAutoScroll()
    }
  }, [])

  // Load existing PDF data from localStorage backup on mount
  useEffect(() => {
    const loadExistingPdf = async () => {
      try {
        // Try to recover from localStorage backup
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

    // Load on mount
    loadExistingPdf()
    
    return () => {
      stopAutoScroll()
    }
  }, [widgetId])

  // Auto-save dashboard state when component unmounts
  useEffect(() => {
    return () => {
      stopAutoScroll()
    }
  }, [])

  const startAutoScroll = () => {
    const container = containerRef.current
    if (!container) return
    
    // Stop any existing scroll animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    
    // Reset to the top before starting
    container.scrollTop = 0
    
      // Wait a moment before starting scroll for better UX
      setTimeout(() => {
        const scrollSpeed = 0.3 // Pixels per frame (slower for better readability)
        const isScrolling = true
      
      const step = () => {
        if (!container || !isScrolling) return
        
        const currentScroll = container.scrollTop
        const maxScroll = container.scrollHeight - container.clientHeight
        
        // Check if we've reached the bottom (with small threshold for smooth looping)
        if (currentScroll >= maxScroll - 2) {
          // Smoothly reset to top for continuous loop
          container.scrollTop = 0
        } else {
          // Continue scrolling down
          container.scrollTop += scrollSpeed
        }
        
        // Continue the animation loop
        rafRef.current = requestAnimationFrame(step)
      }
      
      // Start the animation
      rafRef.current = requestAnimationFrame(step)
      
      // Store scroll state for cleanup
      ;(container as any).__autoScrollActive = true
    }, 500) // Small delay before starting
  }
  
  const stopAutoScroll = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const container = containerRef.current
    if (container) {
      ;(container as any).__autoScrollActive = false
    }
  }

  const renderPdfFromData = async (pdfData: string) => {
    const container = containerRef.current
    if (!container) {
      console.error('Container ref not available')
      return
    }
    
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

      // Check if PDF.js worker is configured
      if (!(pdfjsLib as any).GlobalWorkerOptions.workerSrc) {
        console.warn('PDF.js worker not configured, attempting to configure...')
        try {
          ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs`
        } catch (workerError) {
          console.error('Failed to configure PDF.js worker:', workerError)
        }
      }

      // Load PDF document with error handling
      let pdf
      try {
        // Ensure PDF data is properly formatted
        let pdfSource = pdfData
        if (!pdfSource.startsWith('data:')) {
          pdfSource = `data:application/pdf;base64,${pdfSource}`
        }
        
        // Extract base64 data from data URL
        const base64Data = pdfSource.includes(',') ? pdfSource.split(',')[1] : pdfSource.replace(/^data:application\/pdf;base64,/, '')
        
        // Convert base64 to Uint8Array for PDF.js
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        
        // Load PDF using Uint8Array
        pdf = await (pdfjsLib as any).getDocument({
          data: bytes,
          verbosity: 0
        }).promise
        
        console.log('PDF loaded successfully, pages:', pdf.numPages)
      } catch (loadError: any) {
        console.error('PDF.js load error details:', {
          error: loadError,
          message: loadError?.message,
          name: loadError?.name,
          stack: loadError?.stack?.substring(0, 500)
        })
        // Clear loading indicator
        container.innerHTML = ""
        throw new Error(`Failed to load PDF: ${loadError?.message || 'Unknown error'}`)
      }
      
      // Clear loading indicator
      container.innerHTML = ""

      // Render each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          // Fit page width to container to avoid horizontal scroll
          const containerWidth = container.clientWidth || 600
          const baseViewport = page.getViewport({ scale: 1 })
          
          // Increase scale for better readability (larger text)
          const baseFitScale = containerWidth / baseViewport.width
          const readabilityScale = baseFitScale * 1.2 // 20% larger for better readability
          const viewport = page.getViewport({ scale: readabilityScale })
          
          // Render at much higher pixel density for crisp, clear text
          // Use higher DPI for better text clarity
          const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
          const outputScale = Math.max(3, devicePixelRatio * 2) // Higher DPI for sharper text
          
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d", {
            alpha: false, // Better performance
            desynchronized: true // Better performance
          })
          
          if (!context) {
            throw new Error('Failed to get canvas context')
          }
          
          // Set canvas size for high DPI rendering
          canvas.width = Math.floor(viewport.width * outputScale)
          canvas.height = Math.floor(viewport.height * outputScale)
          
          // Set CSS size to display size (no blur) - this ensures it fits the widget
          canvas.style.width = "100%"
          canvas.style.height = "auto"
          canvas.style.imageRendering = "crisp-edges" // Better text rendering
          
          // Improve text rendering quality
          context.imageSmoothingEnabled = true
          context.imageSmoothingQuality = "high"
          
          // Scale context for high DPI rendering
          context.scale(outputScale, outputScale)
          
          // Render with better quality settings
          await page.render({ 
            canvasContext: context, 
            viewport,
            canvas,
            intent: "display", // Optimize for display
            renderInteractiveForms: false // Better performance
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

  // Save PDF data to localStorage as backup
  const saveToLocalStorage = (pdfData: string, fileName: string) => {
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

  // Generate first-page image from PDF data using PDF.js (client-side only)
  const generateFirstPageImage = async (pdfData: string): Promise<string | undefined> => {
    try {
      if (!pdfData) return undefined

      let pdfSource = pdfData
      if (!pdfSource.startsWith("data:")) {
        pdfSource = `data:application/pdf;base64,${pdfSource}`
      }

      const base64Data = pdfSource.includes(",")
        ? pdfSource.split(",")[1]
        : pdfSource.replace(/^data:application\/pdf;base64,/, "")

      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const pdf = await (pdfjsLib as any).getDocument({
        data: bytes,
        verbosity: 0,
      }).promise

      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.5 })

      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      if (!context) return undefined

      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: context,
        viewport,
      }).promise

      const dataUrl = canvas.toDataURL("image/png")
      console.log("[PDF IMAGE] Generated first-page image on client for widget", widgetId)
      return dataUrl
    } catch (err) {
      console.error("[PDF IMAGE] Failed to generate first-page image on client", err)
      return undefined
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

    // Reset input to allow re-uploading the same file
    e.target.value = ''

    try {
      setIsUploading(true)
      const loadingToast = toast.loading('Uploading PDF to storage...')

      // Upload PDF to Supabase bucket
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/pdf/upload-url', {
        method: 'POST',
        body: formData,
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload PDF')
      }

      const pdfUrl = uploadResult.url
      toast.dismiss(loadingToast)
      toast.loading('Loading PDF for preview...')

      // Convert file to base64 for preview/rendering
      const reader = new FileReader()
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error)
        toast.dismiss()
        toast.error("Failed to read PDF file for preview")
        setIsUploading(false)
      }
      
      reader.onload = async (event) => {
        try {
          const pdfData = event.target?.result as string
          if (!pdfData) {
            throw new Error('No PDF data received from file')
          }
          
          setCurrentPdfData(pdfData)
          
          // Render the uploaded PDF for preview
          await renderPdfFromData(pdfData)
          
          // Save to localStorage as backup (for preview purposes)
          saveToLocalStorage(pdfData, file.name)
          
          // Generate a unique ID for the PDF
          const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

          // Generate first page image on the client
          const pdfimage = await generateFirstPageImage(pdfData)
          
          // Notify parent component about the stored PDF with URL (not base64 data)
          onPdfStored(pdfId, pdfUrl, file.name, pdfimage)
          
          toast.dismiss()
          toast.success('PDF uploaded and stored successfully!')
        } catch (error) {
          console.error("Error processing PDF:", error)
          toast.dismiss()
          toast.error(error instanceof Error ? error.message : "Failed to process PDF")
        } finally {
          setIsUploading(false)
        }
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading PDF:", error)
      toast.dismiss()
      toast.error(error instanceof Error ? error.message : "Failed to upload PDF")
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
              // Filter notices that have pdfData or pdfUrl
              const pdfNotices = (data?.result || []).filter((n: any) => n?.pdfData || n?.pdfUrl)
              console.log('Found PDF notices:', pdfNotices.length, pdfNotices.map((n: any) => ({ 
                title: n.title, 
                fileName: n.pdfFileName, 
                hasPdfData: !!n.pdfData,
                hasPdfUrl: !!n.pdfUrl,
                pdfDataLength: n.pdfData?.length || 0,
                pdfUrl: n.pdfUrl || 'none'
              })))
              
              // Process PDF notices - preserve both pdfData and pdfUrl
              const processedPdfNotices = pdfNotices.map((n: any) => {
                let pdfData = n.pdfData || ''
                
                // Ensure PDF data has data URL prefix for proper rendering (if pdfData exists)
                if (pdfData && !pdfData.startsWith('data:')) {
                  pdfData = `data:application/pdf;base64,${pdfData}`
                  console.log('Added data URL prefix to PDF:', n.pdfFileName)
                }
                
                return {
                  ...n,
                  pdfData: pdfData,
                  pdfUrl: n.pdfUrl || undefined // Preserve pdfUrl if it exists
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
                            const loadingToast = toast.loading('Processing PDF...')
                            
                            let pdfUrl = n.pdfUrl
                            let pdfDataForPreview = n.pdfData
                            
                            // If we have pdfUrl, use it directly (new format)
                            if (pdfUrl && typeof pdfUrl === 'string') {
                              // Fetch PDF for preview
                              try {
                                const response = await fetch(pdfUrl)
                                if (response.ok) {
                                  const blob = await response.blob()
                                  const reader = new FileReader()
                                  reader.onload = async (e) => {
                                    const dataUrl = e.target?.result as string
                                    pdfDataForPreview = dataUrl
                                    setCurrentPdfData(dataUrl)
                                    await renderPdfFromData(dataUrl)
                                    saveToLocalStorage(dataUrl, n.pdfFileName || 'uploaded.pdf')
                                    
                                    const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
                                    const pdfimage = await generateFirstPageImage(dataUrl)
                                    onPdfStored(pdfId, pdfUrl, n.pdfFileName || 'uploaded.pdf', pdfimage)
                                    setIsSelectModalOpen(false)
                                    toast.dismiss(loadingToast)
                                    toast.success('PDF selected successfully')
                                  }
                                  reader.readAsDataURL(blob)
                                  return
                                }
                              } catch (fetchError) {
                                console.error('Error fetching PDF from URL:', fetchError)
                                // Fall through to try pdfData
                              }
                            }
                            
                            // Fallback: If we have pdfData (base64), upload it to Supabase first
                            if (pdfDataForPreview && typeof pdfDataForPreview === 'string') {
                              // Validate PDF data before processing
                              if (pdfDataForPreview.trim() === '') {
                                toast.dismiss(loadingToast)
                                toast.error('Invalid PDF data format')
                                return
                              }
                              
                              // Try to render the PDF first to validate it
                              try {
                                await renderPdfFromData(pdfDataForPreview)
                              } catch (renderError) {
                                console.error('Error rendering selected PDF:', renderError)
                                toast.dismiss(loadingToast)
                                toast.error('Failed to load PDF. The file may be corrupted.')
                                return
                              }
                              
                              // Upload base64 PDF to Supabase to get URL
                              try {
                                // Extract base64 data
                                let base64Data = pdfDataForPreview
                                if (base64Data.startsWith('data:application/pdf;base64,')) {
                                  base64Data = base64Data.replace('data:application/pdf;base64,', '')
                                } else if (base64Data.startsWith('data:')) {
                                  base64Data = base64Data.split(',')[1] || base64Data
                                }
                                
                                // Convert base64 to blob and upload
                                const binaryString = atob(base64Data)
                                const bytes = new Uint8Array(binaryString.length)
                                for (let i = 0; i < binaryString.length; i++) {
                                  bytes[i] = binaryString.charCodeAt(i)
                                }
                                const blob = new Blob([bytes], { type: 'application/pdf' })
                                const file = new File([blob], n.pdfFileName || 'uploaded.pdf', { type: 'application/pdf' })
                                
                                const formData = new FormData()
                                formData.append('file', file)
                                
                                const uploadResponse = await fetch('/api/pdf/upload-url', {
                                  method: 'POST',
                                  body: formData,
                                })
                                
                                const uploadResult = await uploadResponse.json()
                                
                                if (!uploadResult.success || !uploadResult.url) {
                                  throw new Error(uploadResult.error || 'Failed to upload PDF')
                                }
                                
                                pdfUrl = uploadResult.url
                                
                                setCurrentPdfData(pdfDataForPreview)
                                saveToLocalStorage(pdfDataForPreview, n.pdfFileName || 'uploaded.pdf')
                                
                                const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
                                const pdfimage = await generateFirstPageImage(pdfDataForPreview)
                                onPdfStored(pdfId, pdfUrl, n.pdfFileName || 'uploaded.pdf', pdfimage)
                                setIsSelectModalOpen(false)
                                toast.dismiss(loadingToast)
                                toast.success('PDF selected and uploaded successfully!')
                              } catch (uploadError) {
                                console.error('Error uploading PDF to Supabase:', uploadError)
                                toast.dismiss(loadingToast)
                                toast.error('Failed to upload PDF to storage')
                              }
                            } else {
                              toast.dismiss(loadingToast)
                              toast.error('No PDF data or URL found for this file')
                            }
                          } catch (err) {
                            console.error('Error selecting existing PDF:', err)
                            toast.dismiss()
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


