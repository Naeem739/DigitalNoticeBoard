declare module 'pdf-poppler' {
  interface ConvertOptions {
    format?: 'jpeg' | 'png' | 'svg';
    out_dir?: string;
    out_prefix?: string;
    page?: number;
    scale?: number;
    single_file?: boolean;
    print_range?: string;
    ignore_original_page_sizes?: boolean;
    width?: number;
    height?: number;
    crop_h?: number;
    crop_w?: number;
    crop_x?: number;
    crop_y?: number;
    monochrome?: boolean;
    gray?: boolean;
    level2?: boolean;
    level3?: boolean;
  }

  interface PdfPoppler {
    convert(pdfPath: string, options: ConvertOptions): Promise<void>;
    info(pdfPath: string): Promise<{
      creator?: string;
      producer?: string;
      creationdate?: string;
      moddate?: string;
      pages?: number;
      [key: string]: any;
    }>;
  }

  const pdfPoppler: PdfPoppler;
  export = pdfPoppler;
}