/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useState } from "react"
import { createPortal } from "react-dom"
import { Upload, Image as ImageIcon, Settings } from "lucide-react"
import { toast } from "sonner"
import { createNotice } from "@/app/actions/notice.action"
import { getDefaultCategory, ensureDefaultCategories } from "@/app/actions/category.action"

type WidgetSettings = any

type ImageData = {
  id: string
  url: string
  title: string
  file?: File
  dbId?: string
  imageUrl?: string // Supabase Storage URL
  imageFileName?: string // Image file name
  width?: number
  height?: number
  size?: number
  type?: string
}

type ExtendedWidget = {
  id: string
  images?: ImageData[]
  title?: string
}

function reconstructImageUrl(notice: any) {
  let imageUrl = notice.imageUrl
  if (!imageUrl && notice.imageData) {
    const imageType = notice.imageFileName ? notice.imageFileName.split('.').pop()?.toLowerCase() : 'jpeg'
    const mimeType = imageType === 'png' ? 'image/png' : imageType === 'gif' ? 'image/gif' : imageType === 'webp' ? 'image/webp' : 'image/jpeg'
    imageUrl = `data:${mimeType};base64,${notice.imageData}`
  }
  return imageUrl || ''
}

export default function ImageWidget({
  widget,
  settings,
  onSetWidgetImages,
  onOpenSettings,
}: {
  widget: ExtendedWidget
  settings: WidgetSettings
  onSetWidgetImages: (images: ImageData[]) => void
  onOpenSettings: () => void
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [isLoadingExisting, setIsLoadingExisting] = useState(false)
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [animateOpen, setAnimateOpen] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 9
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WebP)')
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image file size must be less than 10MB')
      return
    }

    try {
      setIsUploading(true)
      const loadingToast = toast.loading('Processing image...')

      const reader = new FileReader()
      reader.onload = async (event) => {
        const img = new Image()
        img.onload = async () => {
          try {
            const dataUrl = event.target?.result as string
            // Extract base64 data (remove data URL prefix)
            const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
            
            // Ensure Default(Images) category exists
            await ensureDefaultCategories()
            
            // Get the Default(Images) category
            const defaultImageCategory: any = await getDefaultCategory('IMAGE')
            let imageCategoryId = ""
            
            if (defaultImageCategory.success && defaultImageCategory.result) {
              imageCategoryId = (defaultImageCategory.result as any).id
            } else {
              toast.dismiss(loadingToast)
              toast.error('Failed to find Default(Images) category')
              setIsUploading(false)
              return
            }

            // Create notice data
            const noticeData = {
              title: file.name || "Dashboard Image",
              content: `Dashboard Image: ${file.name}`,
              category: "Default(Images)",
              categoryId: imageCategoryId,
              imageUrl: undefined, // Let server action upload to Supabase and set the URL
              imageFileName: file.name,
              imageData: base64Data, // Store only the base64 data without the prefix
            }

            // Create the notice in the database
            const noticeResult = await createNotice(noticeData)
            
            if (noticeResult.success && noticeResult.message && typeof noticeResult.message !== 'string' && (noticeResult.message as any).id) {
              const notice = noticeResult.message as any
              const noticeId = notice.id
              const imageUrlFromStorage = notice.imageUrl // Get the Supabase Storage URL
              
              const imageData: ImageData = {
                id: `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                url: imageUrlFromStorage || dataUrl, // Use Supabase URL if available, fallback to data URL
                title: file.name,
                file,
                dbId: noticeId, // Store the notice ID
                imageUrl: imageUrlFromStorage, // Store the Supabase Storage URL
                imageFileName: file.name, // Store the file name
                width: img.width,
                height: img.height,
                size: file.size,
                type: file.type,
              }
              
              onSetWidgetImages([imageData])
              toast.dismiss(loadingToast)
              toast.success(`Image uploaded and saved! (${img.width}×${img.height})`, { description: `${(file.size / 1024 / 1024).toFixed(1)}MB` })
            } else {
              toast.dismiss(loadingToast)
              toast.error('Failed to save image to database')
              console.error('Failed to create notice:', noticeResult)
            }
          } catch (error) {
            console.error('Error creating notice for image:', error)
            toast.dismiss(loadingToast)
            toast.error('Failed to save image to database')
          } finally {
            setIsUploading(false)
          }
        }
        img.onerror = () => {
          toast.dismiss(loadingToast)
          toast.error('Failed to process image. Please try again.')
          setIsUploading(false)
        }
        img.src = event.target?.result as string
      }
      reader.onerror = () => {
        toast.dismiss(loadingToast)
        toast.error('Failed to read image file. Please try again.')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {widget.images && widget.images.length > 0 ? (
        <div className="flex-grow flex items-center justify-center relative overflow-hidden">
          <div className="relative w-full h-full group">
            <div
              className="w-full h-full relative overflow-hidden"
              style={{
                borderRadius: `${settings.imageBorderRadius}px`,
                boxShadow: settings.imageShadow ? `${settings.imageShadowOffset}px ${settings.imageShadowOffset}px ${settings.imageShadowBlur}px ${settings.imageShadowColor}` : 'none',
              }}
            >
              <img
                src={widget.images[0].url}
                alt={widget.images[0].title}
                className="w-full h-full transition-all duration-300"
                style={{
                  objectFit: settings.imageFit as any,
                  borderRadius: `${settings.imageBorderRadius}px`,
                  transform: `rotate(${settings.imageRotation}deg)`,
                  filter: `brightness(${settings.imageBrightness}%) contrast(${settings.imageContrast}%) saturate(${settings.imageSaturation}%) blur(${settings.imageBlur}px)${settings.imageGrayscale ? ' grayscale(100%)' : ''}${settings.imageSepia ? ' sepia(100%)' : ''}${settings.imageInvert ? ' invert(100%)' : ''}`,
                  cursor: settings.imageZoom ? 'zoom-in' : 'default',
                }}
                onError={() => toast.error('Image could not be loaded')}
              />

              {settings.imageOverlay && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" style={{ opacity: settings.imageOverlayOpacity }} />
              )}

              {settings.showImageTitle && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent" style={{ color: settings.imageTitleColor, fontSize: `${settings.imageTitleFontSize}px`, fontWeight: settings.imageTitleFontWeight }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{widget.images[0].title}</p>
                      {widget.images[0].width && widget.images[0].height && (
                        <p className="text-xs opacity-75 mt-1">
                          {widget.images[0].width} × {widget.images[0].height}
                          {widget.images[0].size && <span className="ml-2">({(widget.images[0].size / 1024 / 1024).toFixed(1)}MB)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <label className={`cursor-pointer flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${isUploading ? 'opacity-75 cursor-not-allowed animate-pulse' : ''}`}>
                    {isUploading ? (
                      <div className="relative">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-4 h-4 border-2 border-transparent border-t-blue-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
                      </div>
                    ) : (
                      <Upload size={18} className="font-bold" />
                    )}
                    <span className="font-medium">{isUploading ? 'Processing Image...' : 'Replace Image'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                  </label>
                  <button
                    onClick={async () => {
                      try {
                        setIsSelectOpen(true)
                        requestAnimationFrame(() => setAnimateOpen(true))
                        setIsLoadingExisting(true)
                        const resp = await fetch('/api/notice/get-all')
                        const data = await resp.json()
                        const imageNotices = (data?.result || []).filter((n: any) => n?.imageUrl || n?.imageData)
                        const seen = new Set<string>()
                        const unique: any[] = []
                        for (const n of imageNotices) {
                          const key = (n?.imageFileName ?? '').toString().trim().toLowerCase()
                          if (!key) continue
                          if (!seen.has(key)) { seen.add(key); unique.push(n) }
                        }
                        setExistingImages(unique)
                      } catch (e) {
                        console.error('Failed to load existing images', e)
                        setExistingImages([])
                      } finally {
                        setIsLoadingExisting(false)
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium border"
                  >
                    <ImageIcon size={16} />
                    From Existing
                  </button>
                  <button onClick={onOpenSettings} className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                    <Settings size={16} />
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-xl transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/30"
          style={{ borderColor: settings.fontColor, opacity: 0.6, fontFamily: settings.fontFamily }}
        >
          <div className="text-center flex flex-col items-center justify-center h-full">
            <p className="text-sm opacity-75 mb-6" style={{ color: settings.fontColor }}>
              JPG, PNG, GIF, WebP • Max 10MB
            </p>
            <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 text-xs font-medium ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}>
              {isUploading ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div> : <Upload size={12} />}
              {isUploading ? 'Uploading...' : 'Browse Files'}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
            </label>
            <button
              type="button"
              onClick={async () => {
                try {
                  setIsSelectOpen(true)
                  requestAnimationFrame(() => setAnimateOpen(true))
                  setIsLoadingExisting(true)
                  const resp = await fetch('/api/notice/get-all')
                  const data = await resp.json()
                  const imageNotices = (data?.result || []).filter((n: any) => n?.imageUrl || n?.imageData)
                  const seen = new Set<string>()
                  const unique: any[] = []
                  for (const n of imageNotices) {
                    const key = (n?.imageFileName ?? '').toString().trim().toLowerCase()
                    if (!key) continue
                    if (!seen.has(key)) { seen.add(key); unique.push(n) }
                  }
                  setExistingImages(unique)
                } catch (e) {
                  console.error('Failed to load existing images', e)
                  setExistingImages([])
                } finally {
                  setIsLoadingExisting(false)
                }
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 text-xs font-medium"
            >
              <ImageIcon size={12} /> From Existing
            </button>
          </div>
        </div>
      )}

      {isSelectOpen && createPortal(
        <div className="fixed inset-0 z-[1000]">
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-150 ${animateOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => {
              setAnimateOpen(false)
              setTimeout(() => setIsSelectOpen(false), 150)
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-[92vw] max-w-5xl max-h-[85vh] overflow-hidden transition-all duration-150 transform ${animateOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'}`}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3 text-base font-semibold text-gray-800">
                  <div className="p-2 rounded-lg bg-white border border-gray-200"><ImageIcon size={18} className="text-emerald-600" /></div>
                  Choose Existing Image
                </div>
                <button
                  onClick={() => {
                    setAnimateOpen(false)
                    setTimeout(() => setIsSelectOpen(false), 150)
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onChange={(e) => {
                      const q = e.target.value.trim().toLowerCase()
                      setPage(1)
                      setExistingImages((prev: any[]) => prev.map(p => ({ ...p, __hidden: q ? !((p.title||'').toLowerCase().includes(q) || (p.imageFileName||'').toLowerCase().includes(q)) : false })))
                    }}
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    title="Filter by image category"
                  >
                    <option value="all">All categories</option>
                    {[...new Set(existingImages.map((p: any) => (p.category || p.categoryName || '').toString().trim()).filter(Boolean))]
                      .map((cat: string) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                  <div className="text-xs text-gray-500">{existingImages.filter((p: any) => !p.__hidden).length} item{existingImages.filter((p: any) => !p.__hidden).length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div className="p-6 bg-white">
                {isLoadingExisting ? (
                  <div className="flex items-center justify-center py-16 text-sm text-gray-500">Loading images...</div>
                ) : existingImages.length === 0 ? (
                  <div className="text-center py-16 text-sm text-gray-500">No existing image notices found.</div>
                ) : (
                  <>
                    {(() => {
                      const byCategory = existingImages.filter((p: any) => {
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
                            {paged.map((n: any) => {
                      const url = reconstructImageUrl(n)
                      return (
                        <button
                          key={n.id}
                          className="text-left rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all bg-white p-3 flex flex-col gap-3"
                          onClick={async () => {
                            try {
                              if (!url) return
                              onSetWidgetImages([{ id: `img-${Date.now()}-${Math.floor(Math.random()*1000)}`, url, title: n.imageFileName || n.title || 'Image', dbId: n.id }])
                              setAnimateOpen(false)
                              setTimeout(() => setIsSelectOpen(false), 150)
                              toast.success('Image selected successfully')
                            } catch (err) {
                              console.error('Error selecting existing image:', err)
                              toast.error('Failed to select image')
                            }
                          }}
                          title={n.imageFileName || n.title || 'Image'}
                        >
                          <div className="w-full h-28 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                            {url ? (
                              <img src={url} alt={n.title || 'Image'} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-xs text-gray-400">No preview</div>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900 truncate">{n.imageFileName || n.title || 'Image'}</div>
                          <div className="text-xs text-gray-400 truncate">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                        </button>
                      )
                            })}
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-4">
                            <div className="text-xs text-gray-500">Showing {total === 0 ? 0 : start + 1}-{Math.min(end, total)} of {total}</div>
                            <div className="flex items-center gap-2">
                              <button className="px-3 py-1.5 text-sm border rounded-md bg-white disabled:opacity-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={current <= 1}>Prev</button>
                              <div className="text-sm text-gray-600">Page {current} of {totalPages}</div>
                              <button className="px-3 py-1.5 text-sm border rounded-md bg-white disabled:opacity-50" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={current >= totalPages}>Next</button>
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


