import { useQuery } from '@tanstack/react-query';

type TPDF = {
  id: string;
  title: string;
  fileName?: string;
  pdfData?: string;
  createdAt?: Date;
};

type TPDFsResponse = {
  success: boolean;
  result: TPDF[];
};

// Fetch all PDFs
const fetchPDFs = async (): Promise<TPDFsResponse> => {
  const response = await fetch('/api/pdf/get-all');
  if (!response.ok) {
    throw new Error('Failed to fetch PDFs');
  }
  return response.json();
};

export function usePDFs(refetchInterval: number = 5000) {
  return useQuery<TPDFsResponse>({
    queryKey: ['pdfs'],
    queryFn: fetchPDFs,
    refetchInterval, // Refetch every 5 seconds by default for real-time updates
    staleTime: 0, // Always consider data stale to ensure fresh updates
    refetchOnWindowFocus: true,
  });
}




