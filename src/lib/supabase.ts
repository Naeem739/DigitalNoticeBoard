import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization of Supabase client
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return supabaseClient
}

// Export a getter that initializes on first use (returns null if not configured)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.')
    }
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

// Storage bucket names
export const STORAGE_BUCKETS = {
  PDFS: 'notices-pdfs',
  IMAGES: 'notices-images'
} as const

/**
 * Upload a file to Supabase Storage
 * @param file - File or Buffer to upload
 * @param bucket - Storage bucket name
 * @param filePath - Path within the bucket (e.g., 'notices/abc123.pdf')
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadFileToStorage(
  file: File | Buffer | ArrayBuffer,
  bucket: string,
  filePath: string,
  contentType: string
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { 
        url: null, 
        error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.' 
      }
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return { 
        url: null, 
        error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.' 
      }
    }

    // Convert File to ArrayBuffer if needed
    let fileData: ArrayBuffer
    if (file instanceof File) {
      fileData = await file.arrayBuffer()
    } else if (file instanceof Buffer) {
      // Convert Buffer to ArrayBuffer by creating a new Uint8Array
      fileData = new Uint8Array(file).buffer
    } else {
      // file is already ArrayBuffer
      fileData = file as ArrayBuffer
    }

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileData, {
        contentType,
        upsert: true // Overwrite if file exists
      })

    if (error) {
      console.error('Error uploading file to Supabase:', error)
      return { url: null, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error)
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Upload a PDF file to Supabase Storage
 */
export async function uploadPDF(
  file: File | Buffer,
  fileName: string
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  // Generate unique file path: notices/{timestamp}-{random}-{fileName}
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `notices/${timestamp}-${random}-${sanitizedFileName}`

  return uploadFileToStorage(
    file,
    STORAGE_BUCKETS.PDFS,
    filePath,
    'application/pdf'
  )
}

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadImage(
  file: File | Buffer,
  fileName: string
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  // Generate unique file path: notices/{timestamp}-{random}-{fileName}
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `notices/${timestamp}-${random}-${sanitizedFileName}`

  // Determine content type from file name or default to jpeg
  const contentType =
    fileName.toLowerCase().endsWith('.png')
      ? 'image/png'
      : fileName.toLowerCase().endsWith('.gif')
        ? 'image/gif'
        : fileName.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg'

  return uploadFileToStorage(
    file,
    STORAGE_BUCKETS.IMAGES,
    filePath,
    contentType
  )
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFileFromStorage(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { 
        success: false, 
        error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.' 
      }
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return { 
        success: false, 
        error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.' 
      }
    }

    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) {
      console.error('Error deleting file from Supabase:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in deleteFileFromStorage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Extract file path from Supabase Storage URL
 * This is useful for deleting files when you only have the URL
 */
export function extractFilePathFromUrl(url: string, bucket: string): string | null {
  try {
    // Supabase Storage URLs typically look like:
    // https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const urlPattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)`)
    const match = url.match(urlPattern)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Download a file from Supabase Storage as a Buffer
 */
export async function downloadFileFromStorage(
  bucket: string,
  filePath: string
): Promise<{ data: Buffer | null; error: string | null }> {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { 
        data: null, 
        error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.' 
      }
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return { 
        data: null, 
        error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.' 
      }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath)

    if (error) {
      console.error('Error downloading file from Supabase:', error)
      return { data: null, error: error.message }
    }

    if (!data) {
      return { data: null, error: 'No data returned from storage' }
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return { data: buffer, error: null }
  } catch (error) {
    console.error('Error in downloadFileFromStorage:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

