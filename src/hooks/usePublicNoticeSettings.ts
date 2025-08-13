import { useState, useEffect, useCallback } from 'react';
import { PublicNoticeSettings, PublicNoticeTemplate } from '@/types/types';

export const usePublicNoticeSettings = () => {
  const [settings, setSettings] = useState<PublicNoticeSettings | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<PublicNoticeTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadSettings = useCallback(async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/public-notice-settings', { cache: 'no-store' });
      const result = await response.json();
      
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(result.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading public notice settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  const applyTemplate = useCallback(async (templateId: string) => {
    if (!mounted) return false;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'apply' }),
      });

      const result = await response.json();

      if (result.success) {
        // Reload settings after applying template
        await loadSettings();
        
        // Load the template data for immediate use
        const templateResponse = await fetch(`/api/templates/${templateId}`);
        const templateResult = await templateResponse.json();
        
        if (templateResult.success) {
          setActiveTemplate(templateResult.data);
        }
        
        return true;
      } else {
        setError(result.error || 'Failed to apply template');
        return false;
      }
    } catch (error) {
      console.error('Error applying template:', error);
      setError('Failed to apply template');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSettings, mounted]);

  const clearActiveTemplate = useCallback(() => {
    setActiveTemplate(null);
  }, []);

  // Get effective settings (template overrides settings)
  const getEffectiveSettings = useCallback(() => {
    if (!mounted) return null;
    
    if (activeTemplate) {
      return {
        ...settings,
        ...activeTemplate,
      };
    }
    return settings;
  }, [settings, activeTemplate, mounted]);

  // Load settings on mount
  useEffect(() => {
    if (mounted) {
      loadSettings();
    }
  }, [loadSettings, mounted]);

  // Listen for cross-tab update signals and refresh immediately
  useEffect(() => {
    if (!mounted) return;

    let bc: BroadcastChannel | null = null;

    // BroadcastChannel listener
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('public-notice');
      bc.onmessage = (ev) => {
        const msg = ev?.data;
        if (msg && msg.type === 'settings-updated') {
          loadSettings();
        }
      };
    }

    // Fallback via storage event
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'public-notice-settings-updated') {
        loadSettings();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) {
        bc.close();
      }
    };
  }, [mounted, loadSettings]);

  // Manual refresh function
  const refreshSettings = useCallback(() => {
    if (mounted) {
      loadSettings();
    }
  }, [loadSettings, mounted]);

  // Force immediate refresh
  const forceRefresh = useCallback(() => {
    if (mounted) {
      setLoading(true);
      loadSettings();
    }
  }, [loadSettings, mounted]);

  return {
    settings: getEffectiveSettings(),
    originalSettings: settings,
    activeTemplate,
    loading: loading || !mounted,
    error,
    refreshSettings,
    forceRefresh,
    applyTemplate,
    clearActiveTemplate,
  };
}; 