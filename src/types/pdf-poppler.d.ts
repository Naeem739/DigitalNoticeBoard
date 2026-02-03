declare module 'pdf-poppler' {
  interface ConvertOptions {
    format?: 'png' | 'jpeg' | 'tiff' | 'ps' | 'eps' | 'svg'
    out_dir?: string
    out_prefix?: string
    page?: number | null
    scale?: number
    single_file?: boolean
  }

  interface InfoResult {
    Author?: string
    CreationDate?: string
    Creator?: string
    ModDate?: string
    PDFFormatVersion?: string
    Pages?: number
    Producer?: string
    Subject?: string
    Title?: string
  }

  function convert(file: string, opts: ConvertOptions): Promise<void>
  function info(file: string): Promise<InfoResult>

  export = {
    convert,
    info
  }
}
