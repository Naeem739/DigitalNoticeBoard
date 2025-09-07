// PDF Cache Management Utility
// Handles caching of PDF documents and rendered canvases to improve performance

interface CacheEntry {
  data: any
  timestamp: number
  size: number
}

class PDFCacheManager {
  private static instance: PDFCacheManager
  private cache = new Map<string, CacheEntry>()
  private maxCacheSize = 50 * 1024 * 1024 // 50MB
  private maxAge = 30 * 60 * 1000 // 30 minutes
  private currentSize = 0

  private constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  static getInstance(): PDFCacheManager {
    if (!PDFCacheManager.instance) {
      PDFCacheManager.instance = new PDFCacheManager()
    }
    return PDFCacheManager.instance
  }

  set(key: string, data: any): void {
    const size = this.calculateSize(data)
    
    // Remove old entry if it exists
    if (this.cache.has(key)) {
      this.currentSize -= this.cache.get(key)!.size
    }

    // Check if we need to make space
    while (this.currentSize + size > this.maxCacheSize && this.cache.size > 0) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    })
    this.currentSize += size
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    this.currentSize -= entry.size
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.currentSize = 0
  }

  private calculateSize(data: any): number {
    if (data instanceof HTMLCanvasElement) {
      return data.width * data.height * 4 // RGBA bytes
    }
    if (typeof data === 'string') {
      return data.length * 2 // UTF-16 characters
    }
    if (Array.isArray(data)) {
      return data.reduce((sum, item) => sum + this.calculateSize(item), 0)
    }
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).reduce((sum, value) => sum + this.calculateSize(value), 0)
    }
    return 0
  }

  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.delete(key))
  }

  getStats() {
    return {
      size: this.currentSize,
      maxSize: this.maxCacheSize,
      entries: this.cache.size,
      utilization: (this.currentSize / this.maxCacheSize) * 100
    }
  }
}

export const pdfCache = PDFCacheManager.getInstance()

// Utility functions for PDF data management
export const generatePDFCacheKey = (pdfData: string): string => {
  // Create a more robust hash for cache key
  let hash = 0
  const str = pdfData.substring(0, 1000) // Use first 1000 chars for performance
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return `pdf_${Math.abs(hash)}_${pdfData.length}`
}

export const isPDFDataValid = (pdfData: string): boolean => {
  if (!pdfData || typeof pdfData !== 'string') return false
  
  // Check if it's base64 encoded PDF data
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  const cleanData = pdfData.replace(/^data:application\/pdf;base64,/, '')
  
  // More lenient validation - just check if it looks like base64 and has reasonable length
  return base64Regex.test(cleanData) && cleanData.length > 50
}

export const optimizePDFData = (pdfData: string): string => {
  // Remove data URL prefix if present
  return pdfData.replace(/^data:application\/pdf;base64,/, '')
}
