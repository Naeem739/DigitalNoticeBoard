import { useQuery } from '@tanstack/react-query';

type TNotice = {
  id: string;
  title: string;
  content?: string;
  categoryName?: string;
  createdAt?: Date;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfData?: string;
  imageUrl?: string;
  imageFileName?: string;
  imageData?: string;
};

type TNoticesResponse = {
  success: boolean;
  result: TNotice[];
};

// Fetch all notices
const fetchNotices = async (): Promise<TNoticesResponse> => {
  const response = await fetch('/api/notice/get-all');
  if (!response.ok) {
    throw new Error('Failed to fetch notices');
  }
  return response.json();
};

export function useNotices(refetchInterval: number = 5000) {
  return useQuery<TNoticesResponse>({
    queryKey: ['notices'],
    queryFn: fetchNotices,
    refetchInterval, // Refetch every 5 seconds by default for real-time updates
    staleTime: 0, // Always consider data stale to ensure fresh updates
    refetchOnWindowFocus: true,
  });
}




