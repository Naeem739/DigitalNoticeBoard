import { useQuery } from '@tanstack/react-query';

type TDashboard = {
  id: string;
  aspectRatio: string;
  containers: any[];
  createdAt?: Date;
  screenName?: string;
  screenIndex?: number;
  totalScreens?: number;
};

type TPagination = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
};

type TDashboardResponse = {
  success: boolean;
  result: TDashboard[];
  pagination: TPagination | null;
};

// Fetch all dashboards
const fetchDashboards = async (): Promise<TDashboardResponse> => {
  const response = await fetch('/api/dashboard/get-all?limit=100');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboards');
  }
  return response.json();
};

export function useDashboards(refetchInterval: number = 5000) {
  return useQuery<TDashboardResponse>({
    queryKey: ['dashboards'],
    queryFn: fetchDashboards,
    refetchInterval, // Refetch every 5 seconds by default for real-time updates
    staleTime: 0, // Always consider data stale to ensure fresh updates
    refetchOnWindowFocus: true,
  });
}




