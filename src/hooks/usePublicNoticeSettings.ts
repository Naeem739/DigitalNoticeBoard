import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PublicNoticeSettings, PublicNoticeTemplate } from '@/types/types';

type TPublicNoticeSettingsResponse = {
  success: boolean;
  data: PublicNoticeSettings | null;
  error?: string;
};

// Fetch public notice settings
const fetchPublicNoticeSettings = async (): Promise<TPublicNoticeSettingsResponse> => {
  const response = await fetch('/api/public-notice-settings', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch public notice settings');
  }
  return response.json();
};

export const usePublicNoticeSettings = (refetchInterval: number = 300000) => {
  const [activeTemplate, setActiveTemplate] = useState<PublicNoticeTemplate | null>(null);
  const queryClient = useQueryClient();

  // Use TanStack Query for automatic refetching
  const { data, isLoading, error, refetch } = useQuery<TPublicNoticeSettingsResponse>({
    queryKey: ['public-notice-settings'],
    queryFn: fetchPublicNoticeSettings,
    refetchInterval, // Refetch every 5 minutes by default
    staleTime: 0, // Always consider data stale to ensure fresh updates
    refetchOnWindowFocus: true,
  });

  const settings = data?.data || null;

  const applyTemplate = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'apply' }),
      });

      const result = await response.json();

      if (result.success) {
        // Invalidate and refetch settings after applying template
        await queryClient.invalidateQueries({ queryKey: ['public-notice-settings'] });
        
        // Load the template data for immediate use
        const templateResponse = await fetch(`/api/templates/${templateId}`);
        const templateResult = await templateResponse.json();
        
        if (templateResult.success) {
          setActiveTemplate(templateResult.data);
        }
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error applying template:', error);
      return false;
    }
  }, [queryClient]);

  const clearActiveTemplate = useCallback(() => {
    setActiveTemplate(null);
  }, []);

  // Get effective settings (template overrides settings)
  const getEffectiveSettings = useCallback(() => {
    if (activeTemplate) {
      return {
        ...settings,
        ...activeTemplate,
      };
    }
    return settings;
  }, [settings, activeTemplate]);

  // Listen for cross-tab update signals and refresh immediately
  useEffect(() => {
    let bc: BroadcastChannel | null = null;

    // BroadcastChannel listener
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('public-notice');
      bc.onmessage = (ev) => {
        const msg = ev?.data;
        if (msg && msg.type === 'settings-updated') {
          queryClient.invalidateQueries({ queryKey: ['public-notice-settings'] });
        }
      };
    }

    // Fallback via storage event
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'public-notice-settings-updated') {
        queryClient.invalidateQueries({ queryKey: ['public-notice-settings'] });
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) {
        bc.close();
      }
    };
  }, [queryClient]);

  // Manual refresh function
  const refreshSettings = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['public-notice-settings'] });
  }, [queryClient]);

  // Force immediate refresh
  const forceRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    settings: getEffectiveSettings(),
    originalSettings: settings,
    activeTemplate,
    loading: isLoading,
    error: error ? String(error) : data?.error || null,
    refreshSettings,
    forceRefresh,
    applyTemplate,
    clearActiveTemplate,
  };
}; 